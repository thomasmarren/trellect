var store = {
  labels: {},
  sortedLabels: [],
  labelIds: {},
  members: {},
  sortedMembers: [],
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

function afterAuthorization(){
  
  $("#totals-container").html("")
  
  var a = document.createElement("a");
  a.id = "refresh-link"
  a.innerHTML = "Refresh"
  a.onclick = refresh
  document.querySelector("#totals-container").append(a)
  
  var div = document.createElement("div");
  div.id = "totals-nav"
  $(div).html('<a id="labels-tab" onclick="showLabels()">Label</a><a id="members-tab" onclick="fetchMemberData()">Members</a>')
  document.querySelector("#totals-container").append(div)
  
  var div = document.createElement("div");
  div.id = "totals-data"
  document.querySelector("#totals-container").append(div)
  
  fetchLabelData()
}


function fetchCards(){
  
  console.log("Fetching card data")
  
  return new Promise(function(resolve, reject){
    
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


function fetchLabelData(){
  
  showLoader()
  
  fetchCards().then(fetchLabels).then(function(){
    showLabels()
  })
  
}

function fetchLabels(labelIds){
  
  console.log("Fetching labels")
  
  return new Promise(function(resolve, reject){
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
  
  sortLabels(store.labels)
  
  $('#totals-data').html('')
  
  store.sortedLabels.forEach( label => {
    
    var div = document.createElement("div");
    var span = document.createElement("span");
    $(span).addClass(`totals-label-color card-label-${label[1]}`)
    var p = document.createElement("p");
    $(p).addClass(`totals-label`)
    p.innerHTML = `${label[0]}: ${label[2]}`
    div.append(span)
    div.append(p)
    document.querySelector("#totals-data").append(div)
    
  })
}


function fetchMemberData(){
  if(Object.keys(store.members).length == 0){
    console.log("Fetching member data")
    showLoader()
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
  
  sortMembers(store.members)
  
  $("#totals-data").html("")
  var ul = document.createElement("ul");
  $(ul).addClass("members-list")
  $("#totals-data").append(ul)
  
  store.sortedMembers.forEach( member => {
    
    var li = document.createElement("li");
    $(li).addClass("members-list-item")
    var img = document.createElement("img");
    $(img).addClass(`member-avatar`)
    $(img).attr("src", `https://trello-avatars.s3.amazonaws.com/${member[1]}/30.png`)
    var p = document.createElement("p");
    $(p).addClass("member-name")
    p.innerHTML = `${member[0]}: ${member[2]}`
    $(li).append(img)
    $(li).append(p)
    $(ul).append(li)
  })
}


function refresh(){
  console.log('Refreshing totals')
  store = {
    labels: {},
    labelIds: [],
    members: {},
    memberIds: []
  }
  fetchLabelData()
}

function toggleTotals(){
  $('#totals-container').toggleClass("hidden")
}


function apiError(){
  document.querySelector("#totals-data").innerHTML = "<p>Rate limit exceeded. :( Try again in 10 seconds."
}

function sortLabels(labels){
  var sorted = [];
  for (var label in labels) {
    sorted.push([label, labels[label].color, labels[label].count]);
  }

  sorted.sort(function(a, b) {
    return b[2] - a[2];
  });
  
  store.sortedLabels = sorted

}

function sortMembers(members){
  var sorted = [];
  for (var member in members) {
    sorted.push([member, members[member].avatarHash, members[member].count]);
  }

  sorted.sort(function(a, b) {
    return b[2] - a[2];
  });
  
  store.sortedMembers = sorted

}

function showLoader(){
  $("#totals-data").html("")
  $("#totals-data").html("<img src='https://i.imgur.com/vUz7Lmp.gif'>")
}
  
  // Trello.get('/boards/53bee3e719ab8748f95368d9/labels', function(data){ console.log(data) }
