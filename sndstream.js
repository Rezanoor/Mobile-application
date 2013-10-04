document.addEventListener("deviceready", ondeviceready)

var server = '10.68.21.57'

var s3prefix = 'https://s3.amazonaws.com/rezanoor1987/'


var app = null

function ondeviceready(){
  app = new App()
}


function App() {
  var self = this

  var sounddata = "myrecording.mp3";

  var con = $('#con_sndstream')

  var sndstream_images   = $('#sndstream_images')
  var sndstream_image    = $('#sndstream_image')
  var sndstream_register = $('#sndstream_register')
  var sndstream_username = $('#sndstream_username')

  var follow_followers = $('#follow_followers')
  var follow_following = $('#follow_following')
  var follow_search    = $('#follow_search')
  var follow_results   = $('#follow_results')
  var follow_followee  = $('#follow_followee')

  var post_sound = $('#post_sound')
  var post_msg = $('#post_msg')


  $('#nav_sndstream').click(function(){
    showcon('sndstream')
    showimages( load('images') )
    update()
  })

  $('#nav_post').click(function(){
    showcon('post')
  })

  $('#nav_follow').click(function(){
    showcon('follow')
    update()
  })

  $('#btn_recordsound').click(recordSound)
  $('#btn_upload').click(soundUpload)
  $('#btn_register').click(register)
  $('#btn_search').click(search)


  function update() {
    var user = load('user')
    follow_search.val('')
    follow_results.empty()

    http_get(user.username,function(data){
      showfollowers(data.followers)
      showfollows(follow_following,false,data.following)

      save('images',data.stream)
      showimages(data.stream)
    })
  }


  function search() {
    var query = follow_search.val()
    http_get('search/'+escape(query),function(data){
      showfollows(follow_results,true,data.list)
    })
  }


  // Record audio
    // 
    function recordSound() {
  
        var mediaRec = new Media(sounddata, onSuccess, onError);

        // Record audio
        mediaRec.startRecord();

        // Stop recording after 7 sec
        var recTime = 0;
        var recInterval = setInterval(function() {
            recTime = recTime + 1;
            setAudioPosition(recTime + " sec");
            if (recTime >= 7) {
                clearInterval(recInterval);
                mediaRec.stopRecord();
            }
        }, 1000);
    }

    // PhoneGap is ready
    //
    function onDeviceReady() {
        recordAudio();
    }

    // onSuccess Callback
    //
    function onSuccess() {
        showalert('recordAudio():Audio Success');
    }

    // onError Callback 
    //
    function onError(error) {
        showalert('code: '    + error.code    + '\n' + 
              'message: ' + error.message + '\n');
    }

  

  function soundUpload(){
    var user = load('user')

    if( data ) {
      post_msg.text('Uploading...')

      uploadData(function(data){
        http_post(
          user.username+'/post',
          {picid:data.picid},
          function(data){
            post_msg.text('Picture uploaded.')
            appendimage(username,data.picid)            
          }
        )
      })
    }
    else {
      post_msg.text('Take a picture first')
    }
  }


  function uploadData(win) {
    var padI = sounddata.length-1
    while( '=' == sounddata[padI] ) {
      padI--
    }
    var padding = sounddata.length - padI - 1

    var user = load('user')
    $.ajax({
      url:'http://'+server+'/sndstream/api/user/'+user.username+'/upload', 
        type:'POST',
      contentType:'application/octet-stream',
      data:sounddata, 
      headers:{'X-sndstream-Padding':''+padding,
               'X-sndstream-Token':user.token},
      dataType:'json',
      success:win,
      error:function(err){
        showalert('Upload','Could not upload picture.')
      },
    })
  }


  function register() {
    var username = sndstream_username.val()
    if( username && '' != username ) {
      createuser(username)
    }
    else {
      showalert('Registration','Please enter a username.')
    }
  }

  
  function createuser(username){
    http_post('register',{username:username},function(data){
      sndstream_register.hide()
      var user = load('user')
      user.username = username
      user.token = data.token
      save('user',user)
      showcon('post')
    })
  }


  function showimages(images) {
    sndstream_images.empty();
    for( var i = images.length-1; 0 <= i; i-- ) {
      var li = 
        sndstream_image.clone()        
        .css({display:'block'})
      li.find('span').text(images[i].user)
      li.find('img').attr({src:s3prefix+images[i].picid+'.jpg'})
      sndstream_images.append(li)
    }
  }


  function appendimage(username,picid) {
    var images = load('images')
    images.push({picid:picid,user:username})
    save('images',images)
  }


  function showfollowers(followers) {
    follow_followers.empty();
    for( var i = 0; i < followers.length; i++ ) {
      var li = $('<li>').text(followers[i])
      follow_followers.append(li)
    }
    if( 0 == followers.length ) {
      var li = $('<li>').text('No followers yet.')
      follow_followers.append(li)
    }
  }

  function showfollows(follows,yes,users) {
    follows.empty();
    for( var i = 0; i < users.length; i++ ) {
      var username = users[i]
      var li 
        = follow_followee.clone()
        .css({display:'block'})
      li.find('.username').text(username)
      li.find('.follow')
        .attr({id:'username_'+username})
        .text(yes?'Follow':'Unfollow').click(function(){
          follow(yes,$(this))
        })
      follows.append(li)
    }
    if( 0 == users.length ) {
      var li = $('<li>').text('No follows yet.')
      follows.append(li)
    }
  }

  function follow(yes,li) {
    var user = load('user')
    var username = /username_(.*)/.exec( li.attr('id') )[1]
    http_post(
      user.username+'/'+(yes?'':'un')+'follow',
      {username:username},
      function(data){
        li.text(yes?'Unfollow':'Follow').click(function(){
          follow(!yes,$(this))
        })
      }
    )
  }



  function init() {
    var user = load('user')

    if( !user.username ) {
      sndstream_register.show()
    }
    else {
      update()
    }
  }


  function http_get(suffix,win) {
    var user = load('user')
    $.ajax(
      {
        url:'http://'+server+'/sndstream/api/user/'+suffix, 
        headers:{'X-sndstream-Token':user.token},
        dataType:'json',
        success:win,
        error:function(err){
          showalert('Network','Unable to contact server.')
        }
      }
    )
  }


  function http_post(suffix,data,win) {
    var user = load('user')
    $.ajax(
      {
        url:'http://'+server+'/sndstream/api/user/'+suffix, 
        type:'POST',
        headers:{'X-sndstream-Token':user.token},
        contentType:'application/json',
        data:JSON.stringify(data),
        dataType:'json',
        success:win,
        error:function(err){
          showalert('Network','Unable to contact server.')
        }
      }
    )
  }


  function showalert(title,msg){
    navigator.notification.alert(
      msg, 
      function(){},
      title,       
      'OK'
    )
  }


  function showcon(name) {
    if( con ) {
      con.hide()
    }
    con = $('#con_'+name)
    con.show()
  }


  var cache = {}

  function load(key) {
    return cache[key] || JSON.parse(localStorage[key] || '{}')
  }

  function save(key,obj) {
    cache[key] = obj
    localStorage[key] = JSON.stringify(obj)
  }

  
  init()
}


