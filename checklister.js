//JS for Checklister, Stephen Raoul Sullivan 2014-07-20

if (annyang) {
  var commands = {
    'check': function (){
      checkCurrentItem()
    },
    'skip': function () {
      skipCurrentItem() 
    },
    'reset': function () {
      resetChecklist()
    },
    'again': function () {
      restartChecklist()
    }
  };

  annyang.addCommands(commands);
  annyang.start();
}

var wholeChecklist = {}
var checkitems = []
var currentCheckitemIndex = 0
var cardID = '53c9282a87ff2f837302c644'
var checklistID = '53c92832b6443a83d00f823b'
var repeatTime = 5000
var timeoutVar = {}

//Trello.authorize({
//  interactive:false,
//  success: onAuthorize
//});

//Trello functions
var login = function(){
  Trello.authorize({
    type: "popup",
    success: go,
    scope: { write: true, read: true }
  });
}

var go = function(){
  $('#disconnectButton').prop('disabled',false)
  $('#resetButton').prop('disabled',false)
  $('#restartButton').prop('disabled',false)
  $('#connectButton').prop('disabled',true)
  getChecklist(restartChecklist);
}

var logout = function() {
  Trello.deauthorize();
}

$(document).ready(function(){
  $("#connectButton").click(login);
  $("#disconnectButton").click(logout);
  $("#resetButton").click(resetChecklist);
  $("#restartButton").click(restartChecklist);
  $('#repeatTimeInput').change(function(){
    repeatTime = $(this).val()*1000;
    if (repeatTime == 0 || repeatTime > 60000){
      repeatTime = 60000;
      $(this).val(60);
    } 
  });
  $('#cardIDInput').change(function(){
    cardID = $(this).val();
  });
  $('#checklistIDInput').change(function(){
    checklistID = $(this).val();
  });
});

//Grabs a checklist from Trello and restarts
var getChecklist = function(callback){
  Trello.checklists.get(checklistID, function(checklist) {
    //checklist = {"id":"53c92832b6443a83d00f823b","name":"Checklist","idBoard":"527f42ea8ee8c6097300abb7","idCard":"53c9282a87ff2f837302c644","pos":16384,"checkItems":[{"state":"incomplete","id":"53c9289a1e373e70d2fcc40e","name":"apples","nameData":{"emoji":{}},"pos":17133},{"state":"incomplete","id":"53c9289d8f4bb1bed0520415","name":"kittens","nameData":{"emoji":{}},"pos":34367},{"state":"incomplete","id":"53c928a208c860dd4af8584e","name":"invert the main deflector dish","nameData":{"emoji":{}},"pos":50986},{"state":"incomplete","id":"53c92c35ce6b84afdd4e4ffe","name":"kitten apples","nameData":null,"pos":67606},{"state":"incomplete","id":"53c92c3a0d1160100e4a4072","name":"apple kittens","nameData":null,"pos":84133},{"state":"incomplete","id":"53c92c3e8a7791c62a4fbb41","name":"and a beagle","nameData":null,"pos":101299}]}
    console.log(checklist);
    wholeChecklist = checklist
    $('#checklistName').text(wholeChecklist.name)
    $('#allItemsUL').empty()
    for (var x in checklist.checkItems) {
      var checkitem = checklist.checkItems[x]
      var checkboxID = 'checkbox-'+x
      var checkboxDivID = 'checkbox-div-'+x
      $('#allItemsUL').append('<li><div class="checkbox" id="'+checkboxDivID+'"><label><input type="checkbox" id="'+checkboxID+'" onchange="checkboxChange($(this))">'+checkitem.name+'</label></div></li>')
      if (checkitem.state == 'complete'){
        $('#'+checkboxID).prop('checked','checked')
      }
    }
    checkitems = checklist.checkItems;
    callback();
  });
}

var flashCheckboxRow = function(index){
  $('#checkbox-div-'+index).addClass('flash')
  setTimeout(function(){$('#checkbox-div-'+index).removeClass('flash')},500)
}

var strikeoutCheckboxRow = function(index){
  $('#checkbox-div-'+index+' label').addClass('strikeout')
}

var checkboxChange = function($element){
  var value = 'incomplete'
  if ($element.is(':checked')){
    value = 'complete'
  }
  var id = $element.prop('id').split('-')[1]
  checkitems[id].state = value
  trelloDBChange(id,value)
}

//Loads the next item, does the speaking
var nextItem  = function(){
  flashCheckboxRow(currentCheckitemIndex)
  window.clearTimeout(timeoutVar);
  if (currentCheckitemIndex >= checkitems.length){
    var msg = new SpeechSynthesisUtterance();
    text = 'Checklist complete!';
    msg.text = text;
    makeChecklistCompleteNotification(text)
    window.speechSynthesis.speak(msg);
    timeoutVar=setTimeout(nextItem,repeatTime);
  }
  else {  
    var currentCheckitem = checkitems[currentCheckitemIndex]
    text = currentCheckitem.name
    if (currentCheckitem.state == 'complete'){
      text += ' already checked, skipping';
      strikeoutCheckboxRow(currentCheckitemIndex);
      makeSkippedItemNotification(text);
      msg = new SpeechSynthesisUtterance();
      msg.text = text;
      msg.onend = function(){nextItem()};
      setTimeout(function(){window.speechSynthesis.speak(msg);},100);
      currentCheckitemIndex += 1;
    }
    else {
      var msg = new SpeechSynthesisUtterance(text)
      makeCurrentItemNotification(text);
      setTimeout(function(){window.speechSynthesis.speak(msg);},100);
      timeoutVar=setTimeout(nextItem,repeatTime);
    }
  }
}

var makeCurrentItemNotification = function(message){
  $('#currentItemText').text(message)
  $('#currentItemDiv button').prop('disabled',false)
}

var makeSkippedItemNotification = function(message){
  $('#currentItemText').text(message)
  $('#currentItemDiv button').prop('disabled',true)
}
var makeChecklistCompleteNotification = function(message){
  $('#currentItemText').text(message)
  $('#currentItemDiv button').prop('disabled',true)
}

var makeAlert = function(message,success){
  $('#alertDiv').empty().append('<div class="alert alert-'+success+'"><a href="#" class="close" data-dismiss="alert">&times;</a>'+message+'</div>').fadeIn(500)
  setTimeout(function(){$('#alertDiv').fadeOut(1000)},2000)
}

var trelloDBChange = function(checkitemindex,value){
  var currentCheckitem = checkitems[checkitemindex]
  var checkitemID = currentCheckitem.id
  Trello.put('cards/'+cardID+'/checklist/'+checklistID+'/checkitem/'+checkitemID+'/state',
    {value:value},
    makeAlert(currentCheckitem.name+' set to '+value,'success')//,
    //makeAlert('Trello API call failed','danger')
    )
}

var checkCurrentItem = function(){
  window.clearTimeout(timeoutVar)
  var currentCheckitem = checkitems[currentCheckitemIndex]
  checkitemID = currentCheckitem.id
  checkboxID = 'checkbox-'+currentCheckitemIndex

  //update view
  $('#'+checkboxID).prop('checked','checked')
  strikeoutCheckboxRow(currentCheckitemIndex);

  //update model
  checkitems[currentCheckitemIndex]['state'] = 'complete'

  //database change
  trelloDBChange(currentCheckitemIndex,'complete')

  currentCheckitemIndex += 1;
  nextItem()
}
var skipCurrentItem = function(){
  window.clearTimeout(timeoutVar)
  var currentCheckitem = checkitems[currentCheckitemIndex]
  strikeoutCheckboxRow(currentCheckitemIndex);
  makeAlert(currentCheckitem.name+' skipped!','warning')
  currentCheckitemIndex += 1; 
  nextItem()
}
var restartChecklist  = function(){
  window.clearTimeout(timeoutVar)
  var currentCheckitem = checkitems[currentCheckitemIndex]
  $('#allItemsUL label').removeClass('strikeout')
  makeAlert(wholeChecklist.name+' restarted!','success')
  currentCheckitemIndex = 0;
  nextItem()
}
var resetItemByIndex = function(checkitemindex,callback){
  checkitemID = checkitems[checkitemindex].id
  Trello.put('cards/'+cardID+'/checklist/'+checklistID+'/checkitem/'+checkitemID+'/state', 
    {value:'incomplete'}, 
    function(){
      nextcheckitemindex = checkitemindex + 1
      nextcomplete = findnextcomplete(nextcheckitemindex)
      if (nextcomplete == false){
        callback()
      }
      else {
        console.log(nextcomplete)
        resetItemByIndex(nextcomplete,callback)
      }
    }
  )
}
var findnextcomplete = function(index){
  if (index >= checkitems.length){
    return(false)
  }
  if (checkitems[index].state == 'complete'){
    return(index)
  }
  else {
    index += 1
    if (currentCheckitemIndex >= checkitems.length){
      return(false) 
    }
    return(index)
  }
}
var resetChecklist = function(){
  window.clearTimeout(timeoutVar)
  makeAlert(wholeChecklist.name+' reset!','success')
  resetItemByIndex(0,function(){getChecklist(restartChecklist)})
}


