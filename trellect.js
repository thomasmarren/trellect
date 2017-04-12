var store = {
  labels: {},
  labelIds: {},
  members: {},
  memberIds: {}
}

$(document).ready(function(){
  var a = document.createElement("a");
  a.style.display = "inline";
  a.id = 'toggle-totals-button';
  $(a).addClass('board-header-btn')
  a.onclick = toggleTotals
  a.innerHTML = "<span class='icon-sm icon-totals-class board-header-btn-icon'></span><span class='board-header-btn-text'>Totals</span>"
  document.querySelector(".mod-left").append(a)

  var div = document.createElement("div");
  div.id = "totals-container"
  $(div).addClass('hidden')
  document.querySelector(".mod-left").append(div)
  
  var p = document.createElement("p")
  p.id = "unauthorized-msg"
  p.innerHTML = "Please authorize Trello first!"
  $("#totals-container").append(p)

  var button = document.createElement("button");
  button.id = "authorize-button"
  button.style.display = "block"
  button.onclick = authorize
  button.innerHTML = "Authorize"
  document.querySelector("#surface").append(button)
  
})

function afterAuthorization(){
  
  $("#totals-container").html("")
  
  var a = document.createElement("a");
  a.id = "refresh-link"
  a.innerHTML = "Refresh"
  a.onclick = refresh
  document.querySelector("#totals-container").append(a)
  
  var div = document.createElement("div");
  div.id = "totals-nav"
  $(div).html('<a id="labels-tab" onclick="showLabels()"><h3>Labels</h3></a><a id="members-tab" onclick="fetchMemberData()"><h3>Members</h3></a>')
  document.querySelector("#totals-container").append(div)
  
  var div = document.createElement("div");
  div.id = "totals-data"
  document.querySelector("#totals-container").append(div)
  
  fetchInitialData()
}


function authorize(){
  var authenticationSuccess = function() { 
    console.log('Successful authentication');
    document.querySelector("#authorize-button").innerHTML = "Authorized!"
    document.querySelector("#authorize-button").disabled = true
    afterAuthorization()
  };
  var authenticationFailure = function() { console.log('Failed authentication'); };

  Trello.authorize({
    type: 'popup',
    name: 'Trellect',
    scope: {
      read: 'true',
      write: 'true' },
      expiration: 'never',
      success: authenticationSuccess,
      error: authenticationFailure
    });
}

function apiError(){
  document.querySelector("#totals-data").innerHTML = "<p>Rate limit exceeded. :( Try again in 10 seconds."
}

function fetchInitialData(){
  
  document.querySelector("#totals-data").innerHTML = "<img src='https://i.imgur.com/vUz7Lmp.gif'>"
  
  fetchCards().then(fetchLabels).then(function(){
    showLabels()
  })
  
}

function fetchCards(){
  
  console.log("Fetching card data")
  
  return new Promise(function(resolve, reject){
    store.labelIds = {}
    
    Trello.get('/boards/53bee3e719ab8748f95368d9/cards', getCardsSuccess, apiError)
    
    function getCardsSuccess(data){
      
      for(let i = 0; i < data.length + 1; i++){
        
        if(i == data.length){
          done()
        } else {
          data[i].idLabels.forEach( label => {
            if(store.labelIds[label] == undefined){
              store.labelIds[label] = 1
            } else {
              store.labelIds[label] += 1
            }
          })
          data[i].idMembers.forEach( member => {
            if(store.memberIds[member] == undefined){
              store.memberIds[member] = 1
            } else {
              store.memberIds[member] += 1
            }
          })
        }
      }
      
      function done(){
        resolve(store.labelIds)
      }
    }
  })
}



function fetchLabels(labelIds){
  
  console.log("Fetching labels")
  
  return new Promise(function(resolve, reject){
    store.labels = {}
    var counter = 0
    
    for(var id in labelIds){
      Trello.get(`/labels/${id}`, getLabelSuccess, apiError)
      
      function getLabelSuccess(data){
        
        store.labels[data.name] = {}
        store.labels[data.name].color = data.color
        store.labels[data.name].count = store.labelIds[data.id]

        counter += 1
        if(counter == Object.keys(labelIds).length){
          done()
        }
      }
    }
    function done(){
      resolve()
    }
    
  })
}

function showLabels(){
  
  console.log("Displaying labels")
  
  $('#totals-data').html('')
  
  for (var label in store.labels) {
    var div = document.createElement("div");
    var span = document.createElement("span");
    $(span).addClass(`totals-label-color card-label-${store.labels[label].color}`)
    var p = document.createElement("p");
    $(p).addClass(`totals-label`)
    p.innerHTML = `${label}: ${store.labels[label].count}`
    div.append(span)
    div.append(p)
    document.querySelector("#totals-data").append(div)
  }
}



function fetchMemberData(){
  if(Object.keys(store.members).length == 0){
    console.log("Fetching member data")
    fetchMembers(store.memberIds).then(function(){
      showMembers()
    })
  } else {
    showMembers()
  }
}

function fetchMembers(memberIds){
  
  console.log("Fetching members")
  
    return new Promise(function(resolve, reject){
      store.members = {}
      var counter = 0
      
      for(var id in memberIds){
        Trello.get(`/members/${id}`, getMemberSuccess, apiError)
        
        function getMemberSuccess(data){
          
          store.members[data.fullName] = {}
          store.members[data.fullName].avatarHash = data.avatarHash
          store.members[data.fullName].count = store.memberIds[data.id]

          counter += 1
          if(counter == Object.keys(memberIds).length){
            done()
          }
        }
      }
      
      function done(){
        resolve()
      }
      
    })
}

function showMembers(){
  console.log("Displaying members")
  
  $('#totals-data').html('')
  
  for (var member in store.members) {
    var p = document.createElement("p");
    p.innerHTML = `${member}: ${store.members[member].count}`
    document.querySelector("#totals-data").append(p)
  }
}



function refresh(){
  console.log('Refreshing totals')
  store = {
    labels: {},
    labelIds: [],
    members: {},
    memberIds: []
  }
  fetchInitialData()
}

function toggleTotals(){
  $('#totals-container').toggleClass("hidden")
}
  
  
  
// Trello.get(`/labels/${label}`, getLabelSuccess, (msg)=>{console.log(msg)})
// 
// function getLabelSuccess(data){
//   debugger
//   if (store.labels[data.name] == undefined){
//     store.labels[data.name] = {}
//     store.labels[data.name].color = data.color
//     store.labels[data.name].count = 1
//   } else {
//     store.labels[data.name].count += 1
//   }
// }
  
  // Trello.get('/boards/53bee3e719ab8748f95368d9/labels', function(data){ console.log(data) }
