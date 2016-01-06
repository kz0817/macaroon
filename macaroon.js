var context = {
  contents: null,
  contentsDir: "contents",
  contentsIndex: 0,
};

function toSecond(timeString)
{
    var elem = timeString.split(":");
    var hour = Number(elem[0]);
    var min = Number(elem[1]);
    var sec = Number(elem[2]);
    return hour * 3600 + min * 60 + sec;
}

function getItemFromLocalStorage(key)
{
  return localStorage.getItem(key);
}

function setItemToLocalStorage(key, value)
{
  localStorage.setItem(key, value);
}

function appendAlert(msg)
{
  var alertDiv = $("<div>");
  alertDiv.attr("class", "alert alert-danger alert-dismissible");
  alertDiv.attr("role", "alert");

  var closeButton = $("<button>");
  closeButton.attr("class", "close");
  closeButton.attr("data-dismiss", "alert");
  closeButton.append($('<span aria-hidden="true">×</span>'));

  alertDiv.append(closeButton);
  alertDiv.append(msg);
  $("#alert-region").append(alertDiv);
}

function loadContentsList()
{
  var url = context.contentsDir + "/main.json";
  $.getJSON(url)
  .done(function(data) {
    context.contents = data;
    setupContentsList();
  })
  .fail(function(jqXHR, textStatus, errorThrown) {
    appendAlert("Failed to get '" + url + "'. " + textStatus + " : "
                + errorThrown);
  });
}

function fixupContentsUrl(url)
{
  if (url.search("://") != -1)
    return url;
  if (url[0] == "/")
    return url;
  return context.contentsDir + "/" + url;
}

function setLoadingIcon()
{
  $("#loading-icon").show();
}

function clearLoadingIcon()
{
  $("#loading-icon").hide();
}

function loadVideo(url)
{
  var fixedUrl = fixupContentsUrl(url)
  var player = document.getElementById("player");
  player.src = fixedUrl;
  setLoadingIcon();
}

function getPlayTime()
{
  var player = $("#player");
  return player.get(0).currentTime;
}

function setPlayTime(time)
{
  var player = $("#player");
  player.get(0).currentTime = time;
  setLoadingIcon();
}

function setPlayerSizeLabel(label)
{
  var s = label + ' <span class="caret"></span>'
  $("#player-size-button").html(s);
}

function setPlayerSize(playerSize)
{
  var player = $("#player");
  if (playerSize == "Fit") {
    player.css("width", "100%");
    player.css("height", "100%");
    player.css("position", "fixed");
  } else {
    var size = playerSize.split("x");
    var width = Number(size[0]);
    var height = Number(size[1]);
    player.height(height).width(width);
    player.css("position", "static");
  }
  setPlayerSizeLabel(playerSize);
  setItemToLocalStorage("playerSize", playerSize);
}

function setCodecLabel(label)
{
  var s = label + ' <span class="caret"></span>'
  $("#codec-button").html(s);
}

function setCodecMenu(mediaArray)
{
  var menu = $("#codec-menu");
  menu.empty();
  for (var i = 0; i < mediaArray.length; i++) {
    var media = mediaArray[i];
    var item = $("<a>");
    item.attr("class", "codec-item");
    item.attr("data-media-index", i);
    item.text(media.codec);
    menu.append($("<li>").append(item));
  }

  $(".codec-item").click(function(event) {
    event.preventDefault();
    var mediaIndex = $(this).attr("data-media-index");
    var media = context.contents[context.contentsIndex].media[mediaIndex];
    setCodecLabel(media.codec);
    var currTime = getPlayTime()
    loadVideo(media.url);
    setPlayTime(currTime)
  });
}

function setChapterList(chapters)
{
  var list = $("#chapter-list");
  list.empty();
  for (var i = 0; i < chapters.length; i++) {
     var chapter = chapters[i];
     var button = $("<button>");
     button.attr("type", "button");
     button.text(chapter.label);
     button.attr("class", "btn btn-default btn-lg");
     button.attr("data-chapter-time", toSecond(chapter.time));
     button.click(function() {
       setPlayTime($(this).attr("data-chapter-time"));
     });
     list.append(button);
  }
}

function raisePlayer(raise)
{
  if (raise)
    $("#player").css("z-index", "100");
  else
    $("#player").css("z-index", "-100");
  context.playerRaised = raise;
}

function isPlayerRaised()
{
  return context.playerRaised;
}

function setupControlEvents()
{
  var offsetDefs = [
    {"label": "-30min", "time": -30*60},
    {"label": "-5min",  "time": -5*60},
    {"label": "-1min",  "time": -1*60},
    {"label": "-15sec", "time": -15},
    {"label": "-3sec",  "time": -3},
    {"label": "+3sec",  "time": 3},
    {"label": "+15sec", "time": 15},
    {"label": "+1min",  "time": 1*60},
    {"label": "+5min",  "time": 5*60},
    {"label": "+30min", "time": 30*60},
  ];

  for (var i = 0; i < offsetDefs.length; i++) {
    var button = $("<button>");
    button.attr("class", "btn btn-default");
    var offsetTime = offsetDefs[i].time;
    button.attr("data-offset-time", offsetTime);
    button.text(offsetDefs[i].label);

    if (offsetTime > 0)
      $("#ff-button-group").append(button);
    else
      $("#rew-button-group").append(button);

    button.click(function() {
      var offset = Number($(this).attr("data-offset-time"));
      setPlayTime(getPlayTime() + offset);
    });
  }

  $(".player-size").click(function(event) {
    event.preventDefault();
    var resLabel = $(this).text();
    setPlayerSize(resLabel);
  });

  $("#raise-player-button").click(function(event) {
    raisePlayer(true);
  });

  $("#player").click(function(event) {
    raisePlayer(false);
  });

  $("#player").on("canplay", clearLoadingIcon);

  $("body").click(function(event) {
    if (event.eventPhase != Event.AT_TARGET)
      return;
    raisePlayer(!isPlayerRaised());
  });
}

function setupContentsList()
{
  for (var i = 0; i < context.contents.length; i++) {
    var label = context.contents[i].label;

    var button = $("<button>");
    button.attr("type", "button");
    button.text(label);
    button.attr("class", "btn btn-default btn-lg");
    button.attr("data-content-index", i);
    button.click(function() {
        var idx = $(this).attr("data-content-index");
        context.contentsIndex = idx;
        var content = context.contents[idx];
        var media = content.media[0];
        loadVideo(media.url);
        setCodecLabel(media.codec);
        setCodecMenu(content.media);
        setChapterList(content.chapters);
    });
    $("#title-list").append(button);
  }
}

window.onload = function() {
  loadContentsList();
  setupControlEvents();

  playerSize = getItemFromLocalStorage("playerSize");
  if (!playerSize)
    playerSize = "320x180";
  setPlayerSize(playerSize);
};


