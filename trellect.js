var store = {
  backlog: {
    labelIds: {},
    labels: {},
    sortedLabels: [],
    memberIds: {}
  },
  sprint: {
    labelIds: {},
    labels: {},
    sortedLabels: [],
    memberIds: {}
  },
  labelIds: {},
  labels: {},
  sortedLabels: [],
  memberIds: {},
  members: {},
  sortedMembers: []
}

$(document).ready(function(){
  var a = document.createElement("a");
  a.style.display = "inline";
  a.id = 'toggle-totals-button';
  $(a).addClass('board-header-btn')
  a.innerHTML = "<span class='icon-sm icon-totals-class board-header-btn-icon'></span><span id='totals-button-text' class='board-header-btn-text'>Loading...</span>"
  $(".mod-left").append(a)

  var div = document.createElement("div");
  div.id = "totals-container"
  $(div).addClass('hidden')
  $(".mod-left").append(div)
  
  var p = document.createElement("p")
  p.id = "unauthorized-msg"
  p.innerHTML = "Please authorize Trello first!"
  $("#totals-container").append(p)
  
  if(localStorage.getItem("trellect-authorized") == 'true'){
    setTimeout(function(){
      $('#toggle-totals-button').click(toggleTotals)
      authorize()
    }, 3000)
  } else {
    $("#totals-button-text").html('Authorize Trellect')
    $('#toggle-totals-button').click(toggleTotals)
    var button = document.createElement("button");
    button.id = "authorize-button"
    button.style.display = "block"
    button.onclick = authorize
    button.innerHTML = "Authorize"
    $("#totals-container").append(button)
  }
  
})

function authorize(){
  var authenticationSuccess = function() { 
    console.log('Successful authentication');
    localStorage.setItem('trellect-authorized', true)
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
  a.innerHTML = "<span class='icon-sm icon-totals-refresh'></span>"
  a.onclick = refresh
  $("#totals-container").append(a)
  
  var div = document.createElement("div");
  div.id = "totals-nav"
  $(div).html('<a id="labels-tab" onclick="showLabels()">Labels</a><a id="members-tab" onclick="fetchMemberData()">Members</a>')
  $("#totals-container").append(div)
  
  var div = document.createElement("div");
  div.id = "totals-data"
  $("#totals-container").append(div)
  
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
          if (data[i].idList == "56128873d680aae0cc12293c"){
            data[i].idLabels.forEach( label => {
              if(store.backlog.labelIds[label] == undefined){
                store.backlog.labelIds[label] = {}
                store.backlog.labelIds[label].count = 1
                let points = addPoints(store.backlog.labelIds[label].points, data[i].name, true)
                store.backlog.labelIds[label].points = points
              } else {
                store.backlog.labelIds[label].count += 1
                let points = addPoints(store.backlog.labelIds[label].points, data[i].name, false)
                store.backlog.labelIds[label].points = points
              }
            })
            data[i].idMembers.forEach( member => {
              if(store.backlog.memberIds[member] == undefined){
                store.backlog.memberIds[member] = 1
              } else {
                store.backlog.memberIds[member] += 1
              }
            })
          } else {
            data[i].idLabels.forEach( label => {
              if(store.sprint.labelIds[label] == undefined){
                store.sprint.labelIds[label] = {}
                store.sprint.labelIds[label].count = 1
                let points = addPoints(store.sprint.labelIds[label].points, data[i].name, true)
                store.sprint.labelIds[label].points = points
              } else {
                store.sprint.labelIds[label].count += 1
                let points = addPoints(store.sprint.labelIds[label].points, data[i].name, false)
                store.sprint.labelIds[label].points = points
              }
            })
            data[i].idMembers.forEach( member => {
              if(store.sprint.memberIds[member] == undefined){
                store.sprint.memberIds[member] = 1
              } else {
                store.sprint.memberIds[member] += 1
              }
            })
          }
          data[i].idLabels.forEach( label => {
            if(store.labelIds[label] == undefined){
              store.labelIds[label] = {}
              store.labelIds[label].count = 1
              let points = addPoints(store.labelIds[label].points, data[i].name, true)
              store.labelIds[label].points = points
            } else {
              store.labelIds[label].count += 1
              let points = addPoints(store.labelIds[label].points, data[i].name, true)
              store.labelIds[label].points = points
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
    $('#totals-button-text').html('Totals')
  })
  
}

function fetchLabels(labelIds){
  
  console.log("Fetching labels")
  
  return new Promise(function(resolve, reject){
    var counter = 0
    
    for(let id in labelIds){
      Trello.get(`/labels/${id}`, getLabelSuccess, apiError)
      
      function getLabelSuccess(data){
        
        store.sprint.labels[data.name] = {}
        store.sprint.labels[data.name].color = data.color
        store.sprint.labels[data.name].count = store.sprint.labelIds[data.id].count
        store.sprint.labels[data.name].points = store.sprint.labelIds[data.id].points

        counter += 1
        if(counter == Object.keys(labelIds).length){
          fetchBacklog(store.backlog.labelIds)
        }
      }
    }
    
    function fetchBacklog(labelIds){
      var counter = 0
      
      for(let id in labelIds){
        Trello.get(`/labels/${id}`, getLabelSuccess, apiError)
        
        function getLabelSuccess(data){
          
          store.backlog.labels[data.name] = {}
          store.backlog.labels[data.name].color = data.color
          store.backlog.labels[data.name].count = store.backlog.labelIds[data.id].count
          store.backlog.labels[data.name].points = store.backlog.labelIds[data.id].points

          counter += 1
          if(counter == Object.keys(labelIds).length){
            done()
          }
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
  
  sortLabels(store.sprint.labels)
  sortBacklogLabels(store.backlog.labels)
  
  $('#totals-data').html('')
  
  $('#totals-data').append('<p class="category"><strong>Sprint</strong></p>')
  
  store.sprint.sortedLabels.forEach( label => {
    var div = document.createElement("div");
    $(div).addClass("label-container")
    $(div).html(`
      <p>${label[3]}</p><p>${label[2]}</p><span class="totals-label-color card-label-${label[1]}"></span><p>${label[0]}</p>
    `)
    $("#totals-data").append(div)
  })
  
  $('#totals-data').append('<p class="category"><strong>Backlog</strong></p>')
  
  store.backlog.sortedLabels.forEach( label => {
    var div = document.createElement("div");
    $(div).addClass("label-container")
    $(div).html(`
      <p>${label[3]}</p><p>${label[2]}</p><span class="totals-label-color card-label-${label[1]}"></span><p>${label[0]}</p>
    `)
    $("#totals-data").append(div)
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
      
      for(let id in memberIds){
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
    backlog: {
      labelIds: {},
      labels: {},
      sortedLabels: [],
      memberIds: {}
    },
    sprint: {
      labelIds: {},
      labels: {},
      sortedLabels: [],
      memberIds: {}
    },
    labelIds: {},
    labels: {},
    sortedLabels: [],
    memberIds: {},
    members: {},
    sortedMembers: []
  }
  fetchLabelData()
}

function toggleTotals(){
  $('#totals-container').toggleClass("hidden")
}


function apiError(){
  $("#totals-data").html("<p>Rate limit exceeded. :( Try again in 10 seconds.")
}

function addPoints(points, cardName, newKey){
  var regExp = /\(([^)]+)\)/;
  var match = regExp.exec(cardName);
  if(match != null){
    if(newKey){
      points = parseInt(match[1])
    } else {
      points += parseInt(match[1])
    }
  } else {
    points = 0
  }
  return points
}

function sortLabels(labels){
  var sorted = [];
  for (let label in labels) {
    sorted.push([label, labels[label].color, labels[label].count, labels[label].points]);
  }

  sorted.sort(function(a, b) {
    return b[2] - a[2];
  });
  
  store.sprint.sortedLabels = sorted

}

function sortBacklogLabels(labels){
  var sorted = [];
  for (let label in labels) {
    sorted.push([label, labels[label].color, labels[label].count, labels[label].points]);
  }

  sorted.sort(function(a, b) {
    return b[2] - a[2];
  });
  
  store.backlog.sortedLabels = sorted

}

function sortMembers(members){
  var sorted = [];
  for (let member in members) {
    sorted.push([member, members[member].avatarHash, members[member].count]);
  }

  sorted.sort(function(a, b) {
    return b[2] - a[2];
  });
  
  store.sortedMembers = sorted

}

function showLoader(){
  $("#totals-data").html("")
  $("#totals-data").html("<img id='loader' src='http://rewardian.com/images/load-page.gif'>")
}
