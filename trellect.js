var store = {
  authorized: false,
  labels: {},
  labelIds: [],
  newData: true
}

$(document).ready(function(){
  var button = document.createElement("button");
  button.style.display = "inline";
  button.id = 'toggle-totals-button';
  button.onclick = toggleTotals
  button.innerHTML = "Totals"
  document.querySelector(".mod-left").append(button)

  var div = document.createElement("div");
  div.id = "totals-container"
  $(div).addClass('hidden')
  document.querySelector(".mod-left").append(div)

  var button = document.createElement("button");
  button.id = "authorize-button"
  button.style.display = "block"
  button.onclick = authorize
  button.innerHTML = "Authorize"
  document.querySelector("#surface").append(button)
  
  var a = document.createElement("a");
  a.id = "refresh-link"
  a.innerHTML = "Refresh"
  a.onclick = refresh
  document.querySelector("#totals-container").append(a)
  
  var div = document.createElement("div");
  div.id = "totals-data"
  document.querySelector("#totals-container").append(div)
  
})


function authorize(){
  var authenticationSuccess = function() { 
    console.log('Successful authentication');
    store.authorized = true
    document.querySelector("#authorize-button").innerHTML = "Authorized!"
    document.querySelector("#authorize-button").disabled = true
    fetchData()
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

function fetchData(){
  
  document.querySelector("#totals-data").innerHTML = "<img src='https://i.imgur.com/vUz7Lmp.gif'>"
  
  console.log("Fetching label ids")
  
  new Promise(function(resolve, reject){
    store.labelIds = []
    
    Trello.get('/boards/53bee3e719ab8748f95368d9/cards', getCardsSuccess, apiError)
    
    function getCardsSuccess(data){
      
      for(let i = 0; i < data.length + 1; i++){
        
        if(i == data.length){
          done()
        } else {
          data[i].idLabels.forEach( label => {
            store.labelIds.push(label)
          })
        }
      }
      
      function done(){
        resolve(store.labelIds)
      }
    }
  }).then(fetchLabels).then(function(){
    show()
  })
  
}

function fetchLabels(labelIds){
  
  console.log("Fetching labels")
  
  return new Promise(function(resolve, reject){
    store.labels = {}
    var counter = 0
    
    labelIds.forEach( label => {
      
      Trello.get(`/labels/${label}`, getLabelSuccess, apiError)
      
      function getLabelSuccess(data){
        if (store.labels[data.name] == undefined){
          store.labels[data.name] = {}
          store.labels[data.name].color = data.color
          store.labels[data.name].count = 1
        } else {
          store.labels[data.name].count += 1
        }
        counter += 1
        if(counter == labelIds.length){
          done()
        }
      }
    })
    
    function done(){
      resolve()
    }
    
  })
}

function show(){
  
  console.log("Displaying totals")
  
  $('#totals-data').html('')
  
  var div = document.createElement("div");
  div.id = "totals-data-labels"
  document.querySelector("#totals-data").append(div)
  $('#totals-data-labels').html('<h3>Labels</h3>')
  
  var div = document.createElement("div");
  div.id = "totals-data-members"
  document.querySelector("#totals-data").append(div)
  $('#totals-data-members').html('<h3>Members</h3>')
  
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
  
function refresh(){
  console.log('Refreshing totals')
  fetchData()
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
