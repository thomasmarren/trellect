var store = {
  currentSprint: {
    backlog: {
      labelIds: {},
      labels: {},
      sortedLabels: [],
      memberIds: {},
      totalCount: 0,
      totalPoints: 0
    },
    sprint: {
      labelIds: {},
      labels: {},
      sortedLabels: [],
      memberIds: {},
      totalCount: 0,
      totalPoints: 0
    },
    labelIds: {},
    labels: {},
    sortedLabels: [],
    memberIds: {},
    members: {},
    sortedMembers: []  
  },
  archive: {},
  archiveTotalLabels: 0
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
  
  fetchInitialData()
}

function fetchInitialData(){
  
  showLoader()
  
  fetchSprintCards()
  .then(fetchSprintLabels)
  .then(function(){
    showLabels()
    $('#totals-button-text').html('Totals')
  })
  
}


function fetchSprintCards(){
  
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
              if(store.currentSprint.backlog.labelIds[label] == undefined){
                store.currentSprint.backlog.labelIds[label] = {}
                store.currentSprint.backlog.labelIds[label].count = 1
                let points = addPoints(0, data[i].name, true)
                store.currentSprint.backlog.labelIds[label].points = points
              } else {
                store.currentSprint.backlog.labelIds[label].count += 1
                let points = addPoints(store.currentSprint.backlog.labelIds[label].points, data[i].name, false)
                store.currentSprint.backlog.labelIds[label].points = points
              }
            })
            data[i].idMembers.forEach( member => {
              if(store.currentSprint.backlog.memberIds[member] == undefined){
                store.currentSprint.backlog.memberIds[member] = 1
              } else {
                store.currentSprint.backlog.memberIds[member] += 1
              }
            })
          } else {
            data[i].idLabels.forEach( label => {
              if(store.currentSprint.sprint.labelIds[label] == undefined){
                store.currentSprint.sprint.labelIds[label] = {}
                store.currentSprint.sprint.labelIds[label].count = 1
                let points = addPoints(0, data[i].name, true)
                store.currentSprint.sprint.labelIds[label].points = points
              } else {
                store.currentSprint.sprint.labelIds[label].count += 1
                let points = addPoints(store.currentSprint.sprint.labelIds[label].points, data[i].name, false)
                store.currentSprint.sprint.labelIds[label].points = points
              }
            })
            data[i].idMembers.forEach( member => {
              if(store.currentSprint.sprint.memberIds[member] == undefined){
                store.currentSprint.sprint.memberIds[member] = 1
              } else {
                store.currentSprint.sprint.memberIds[member] += 1
              }
            })
          }
          data[i].idLabels.forEach( label => {
            if(store.currentSprint.labelIds[label] == undefined){
              store.currentSprint.labelIds[label] = {}
              store.currentSprint.labelIds[label].count = 1
              let points = addPoints(0, data[i].name, true)
              store.currentSprint.labelIds[label].points = points
            } else {
              store.currentSprint.labelIds[label].count += 1
              let points = addPoints(store.currentSprint.labelIds[label].points, data[i].name, true)
              store.currentSprint.labelIds[label].points = points
            }
          })
          data[i].idMembers.forEach( member => {
            if(store.currentSprint.memberIds[member] == undefined){
              store.currentSprint.memberIds[member] = 1
            } else {
              store.currentSprint.memberIds[member] += 1
            }
          })
        }
      }
      
      function done(){
        resolve(store.currentSprint.sprint.labelIds)
      }
    }
    
  })
}

function fetchSprintLabels(labelIds){

  console.log("Fetching sprint labels")
  
  return new Promise(function(resolve, reject){
    var counter = 0
    
    for(let id in labelIds){
      Trello.get(`/labels/${id}`, getLabelSuccess, apiError)
      
      function getLabelSuccess(data){
        
        store.currentSprint.sprint.labels[data.name] = {}
        store.currentSprint.sprint.labels[data.name].id = id
        store.currentSprint.sprint.labels[data.name].color = data.color
        store.currentSprint.sprint.labels[data.name].count = store.currentSprint.sprint.labelIds[data.id].count
        store.currentSprint.sprint.labels[data.name].points = store.currentSprint.sprint.labelIds[data.id].points
        store.currentSprint.sprint.totalCount += store.currentSprint.sprint.labelIds[data.id].count
        store.currentSprint.sprint.totalPoints += store.currentSprint.sprint.labelIds[data.id].points

        counter += 1
        if(counter == Object.keys(labelIds).length){
          fetchBacklog(store.currentSprint.backlog.labelIds)
        }
      }
    }
    
    function fetchBacklog(labelIds){
      var counter = 0
      
      for(let id in labelIds){
        Trello.get(`/labels/${id}`, getLabelSuccess, apiError)
        
        function getLabelSuccess(data){
          
          store.currentSprint.backlog.labels[data.name] = {}
          store.currentSprint.backlog.labels[data.name].color = data.color
          store.currentSprint.backlog.labels[data.name].count = store.currentSprint.backlog.labelIds[data.id].count
          store.currentSprint.backlog.labels[data.name].points = store.currentSprint.backlog.labelIds[data.id].points
          store.currentSprint.backlog.totalCount += store.currentSprint.backlog.labelIds[data.id].count
          store.currentSprint.backlog.totalPoints += store.currentSprint.backlog.labelIds[data.id].points

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
  
  store.currentSprint.sprint.sortedLabels = sortLabels(store.currentSprint.sprint.labels)
  store.currentSprint.backlog.sortedLabels = sortLabels(store.currentSprint.backlog.labels)
  
  $('#totals-data').html('')
  
  $('#totals-data').append('<p class="category"><strong>Sprint</strong></p>')
  $('#totals-data').append("<table id='sprint-labels' class='trellect-table'><tr><th></th><th>Department</th><th>Count</th><th>Count %</th><th>Points</th><th>Points %</th></tr>")
  
  store.currentSprint.sprint.sortedLabels.forEach( label => {
    
    $('#sprint-labels').append(`
    <tr>
    <td class='card-label-${label[1]}'></td>
    <td>${label[0]}</td>
    <td>${label[2]}</td>
    <td>${percentage(label[2], store.currentSprint.sprint.totalCount)}%</td>
    <td>${label[3]}</td>
    <td>${percentage(label[3], store.currentSprint.sprint.totalPoints)}%</td>
    </tr>
    `)
  })
  
  $('#totals-data').append('<p class="category"><strong>Backlog</strong></p>')
  $('#totals-data').append("<table id='backlog-labels' class='trellect-table'><tr><th></th><th>Department</th><th>Count</th><th>Count %</th><th>Points</th><th>Points %</th></tr>")
  
  store.currentSprint.backlog.sortedLabels.forEach( label => {
    $('#backlog-labels').append(`
    <tr>
    <td class='card-label-${label[1]}'></td>
    <td>${label[0]}</td>
    <td>${label[2]}</td>
    <td>${percentage(label[2], store.currentSprint.backlog.totalCount)}%</td>
    <td>${label[3]}</td>
    <td>${percentage(label[3], store.currentSprint.backlog.totalPoints)}%</td>
    </tr>
    `)
  })
  
  function percentage(value, total){
    if(total == 0){
      return 0
    }
    return Math.round((parseInt(value) / total) * 100)
  }
  
}



// function fetchArchiveCards(){
//   
//   console.log("Fetching archive card data")
//   
//   return new Promise(function(resolve, reject){
//     
//     Trello.get('/boards/5755d13e338da3121111d199/lists', getListsSuccess, apiError)
//     
//     function getListsSuccess(data){
//       for(let i = 0; i < 4; i++){
//         if(i == 3){
//           fetchCards()
//         } else {
//           store.archive[data[i].id] = {
//             name: data[i].name,
//             labelIds: {},
//             labels: {},
//             sortedLabels: []
//           }
//         }
//       }
//     }
//     
//     function fetchCards(){
//       
//       var lists = store.archive
//       
//       for(let list in store.archive){
//         Trello.get(`/lists/${list}/cards`, getCardsSuccess, apiError)
//       }
//       
//       function getCardsSuccess(data){
//         
//         for(let i = 0; i < data.length + 1; i++){
//           if(i == data.length){
//             done()
//           } else {
//             data[i].idLabels.forEach( label => {
//               store.archiveTotalLabels += 1
//               if(store.archive[data[i].idList].labelIds[label] == undefined){
//                 store.archive[data[i].idList].labelIds[label] = {}
//                 store.archive[data[i].idList].labelIds[label].count = 1
//                 let points = addPoints(store.archive[data[i].idList].labelIds[label].points, data[i].name, true)
//                 store.archive[data[i].idList].labelIds[label].points = points
//               } else {
//                 store.archive[data[i].idList].labelIds[label].count += 1
//                 let points = addPoints(store.archive[data[i].idList].labelIds[label].points, data[i].name, true)
//                 store.archive[data[i].idList].labelIds[label].points = points
//               }
//             })
//           }
//         }
//         
//         function done(){
//           resolve(store.archive)
//         }
//       }
//       
//     }
//   })
// }
// 
// function fetchArchiveLists(archiveLists){
//   
// }
// 
// function fetchArchiveLabels(archiveLists){
//   
//   console.log("Fetching archive labels")
//   
//   return new Promise(function(resolve, reject){
//     
//     var counter = 0
//     
//     for(let list in archiveLists){
//       
//       console.log("List" + list)
//       
//       var labelIds = store.archive[list].labelIds
//       
//       for(let id in labelIds){
//         console.log(id)
//         Trello.get(`/labels/${id}`, getLabelSuccess, apiError)
//         
//         function getLabelSuccess(data){
//           
//           store.archive[list].labels[data.name] = {}
//           store.archive[list].labels[data.name].color = data.color
//           store.archive[list].labels[data.name].count = store.archive[list].labels[data.name].count
//           store.archive[list].labels[data.name].points = store.archive[list].labels[data.name].points
//           
//           console.log('counter ' + counter)
//           counter += 1
//           if(counter == store.archiveTotalLabels){
//             console.log('done')
//             done()
//           }
//         }
//       }
//     }
//     
//     function done(){
//       resolve()
//     }
//   })
// }


function fetchMemberData(){
  if(Object.keys(store.currentSprint.members).length == 0){
    console.log("Fetching member data")
    showLoader()
    fetchMembers(store.currentSprint.memberIds).then(function(){
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
          
          store.currentSprint.members[data.fullName] = {}
          store.currentSprint.members[data.fullName].avatarHash = data.avatarHash
          store.currentSprint.members[data.fullName].count = store.currentSprint.memberIds[data.id]

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
  
  sortMembers(store.currentSprint.members)
  
  $("#totals-data").html("")
  var ul = document.createElement("ul");
  $(ul).addClass("members-list")
  $("#totals-data").append(ul)
  
  store.currentSprint.sortedMembers.forEach( member => {
    
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
    currentSprint: {
      backlog: {
        labelIds: {},
        labels: {},
        sortedLabels: [],
        memberIds: {},
        totalCount: 0,
        totalPoints: 0
      },
      sprint: {
        labelIds: {},
        labels: {},
        sortedLabels: [],
        memberIds: {},
        totalCount: 0,
        totalPoints: 0
      },
      labelIds: {},
      labels: {},
      sortedLabels: [],
      memberIds: {},
      members: {},
      sortedMembers: []  
    },
    archive: {},
    archiveTotalLabels: 0
  }
  fetchInitialData()
}

function toggleTotals(){
  $('#totals-container').toggleClass("hidden")
}


function apiError(){
  $("#totals-data").html("<p>Rate limit exceeded. :( Try again in 10 seconds.")
}

function addPoints(points, cardName, newKey){
  var regExp = /\(([^)]+)\)/;
  var match = regExp.exec(cardName.substring(0,3));
  if(match != null){
    if(newKey){
      points = parseInt(match[1])
    } else {
      points += parseInt(match[1])
    }
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
  
  return sorted

}

function sortMembers(members){
  var sorted = [];
  for (let member in members) {
    sorted.push([member, members[member].avatarHash, members[member].count]);
  }

  sorted.sort(function(a, b) {
    return b[2] - a[2];
  });
  
  store.currentSprint.sortedMembers = sorted

}

function showLoader(){
  $("#totals-data").html("")
  $("#totals-data").html("<img id='loader' src='http://rewardian.com/images/load-page.gif'>")
}
