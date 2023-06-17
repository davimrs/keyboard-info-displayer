'use strict';
//#region Requires

const { app, BrowserWindow, globalShortcut, Tray, Menu, powerMonitor } = require('electron');
const path = require('path');
var PNG = require('image-pixels');
var gamesense = require('gamesense-client');
const iconPath = path.join(__dirname, 'icon.png');
var fontjson = require('./fonttable.json'); //(with path)
var settingjson = require('./setting.json'); //(with path)
const fetch = require("node-fetch");
const os = require('os-utils');
const fs = require('fs');


// create an API instance using the default setting

const numberOfFunction = 2;//0 = main page, 1 = font selection.
const numberOfPageInManu = 2;//0 = time,temp,osinfo // 1= timers
const fps = settingjson.fps;

var updateOLEDEventID, updateBlinkEventID;

var selectedFunction = 0, selectedMenuPage = 0;//default page index

var WordSpacing = 6;

var keyboardClockJSON =
{
  'index': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  'keycaps': [gamesense.RgbPerKeyZone.ESCAPE,
  gamesense.RgbPerKeyZone.F1,
  gamesense.RgbPerKeyZone.F2,
  gamesense.RgbPerKeyZone.F3,
  gamesense.RgbPerKeyZone.F4,
  gamesense.RgbPerKeyZone.F5,
  gamesense.RgbPerKeyZone.F6,
  gamesense.RgbPerKeyZone.F7,
  gamesense.RgbPerKeyZone.F8,
  gamesense.RgbPerKeyZone.F9,
  gamesense.RgbPerKeyZone.F10,
  gamesense.RgbPerKeyZone.F11,
  gamesense.RgbPerKeyZone.F12,
  gamesense.RgbPerKeyZone.KEYBOARD_0,
  gamesense.RgbPerKeyZone.KEYBOARD_1,
  gamesense.RgbPerKeyZone.KEYBOARD_2,
  gamesense.RgbPerKeyZone.KEYBOARD_3,
  gamesense.RgbPerKeyZone.KEYBOARD_4,
  gamesense.RgbPerKeyZone.KEYBOARD_5,
  gamesense.RgbPerKeyZone.KEYBOARD_6,
  gamesense.RgbPerKeyZone.KEYBOARD_7,
  gamesense.RgbPerKeyZone.KEYBOARD_8,
  gamesense.RgbPerKeyZone.KEYBOARD_9,
  gamesense.RgbPerKeyZone.BACKQUOTE,
  gamesense.RgbPerKeyZone.DASH],
  'col': [new gamesense.Color(0, 0, 0),
  new gamesense.Color(0, 0, 1),
  new gamesense.Color(0, 1, 0),
  new gamesense.Color(1, 0, 0),
  new gamesense.Color(0, 0, 1),
  new gamesense.Color(0, 1, 0),
  new gamesense.Color(1, 0, 0),
  new gamesense.Color(0, 0, 1),
  new gamesense.Color(0, 1, 0),
  new gamesense.Color(1, 0, 0),
  new gamesense.Color(0, 0, 1),
  new gamesense.Color(0, 1, 0),
  new gamesense.Color(1, 0, 0),
  new gamesense.Color(0, 0, 1),
  new gamesense.Color(0, 1, 0),
  new gamesense.Color(1, 0, 0),
  new gamesense.Color(0, 0, 1),
  new gamesense.Color(0, 1, 0),
  new gamesense.Color(1, 0, 0),
  new gamesense.Color(0, 0, 1),
  new gamesense.Color(0, 1, 0),
  new gamesense.Color(1, 0, 0),
  new gamesense.Color(0, 0, 1),
  new gamesense.Color(0, 1, 0),
  new gamesense.Color(1, 0, 0)]
};

//#region Electron Set up
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}
//https://www.electronjs.org/docs/api/accelerator
var keyboardFunctionEnable = true;
var OLEDEvent, client;

const noWindowMode = async () => {
  app.Tray = new Tray(iconPath);

  updateMenu();
  app.Tray.setToolTip('Custom Keyboard App');

  //#region Shortcut Key init
  // Register a 'CommandOrControl+X' shortcut listener.
  const nsret = globalShortcut.register('VolumeUp', () => {
    console.log('VolumeUp' + ' is pressed')

    switch (selectedFunction) {
      //You can add more Sub menu in here=============================================================!
      case 0://change stop index in main menu
        //You can add more page for this main menu in here============================================O
        switch (selectedMenuPage) {
          case 0://normal info
            break;
          case 1://timer
            if (timerOptionIndex < 4) {
              TimerDigiUpdate(1);
            } else if (timerOptionIndex == 4) {
              if (!bTimerStart)
                doTimerStart();
            } else {
              if (bTimerStart)
                doTimerStop();
            }
            break;
        //============================================================================================O
        }
        break;
      case 1:
        changeFontIndex(1);
        break;
       //=============================================================================================!

    }

    if (debugindex < 128)
      debugindex++;
  })
// VolumeDown a.k.a scoll wheel down
  const psret = globalShortcut.register('VolumeDown', () => {
    console.log('VolumeDown' + ' is pressed')
    switch (selectedFunction) {
      case 0:
        switch (selectedMenuPage) {
          case 0://normal info
            break;
          case 1://timer
            if (timerOptionIndex < 4) {
              TimerDigiUpdate(-1);
            } else if (timerOptionIndex == 4) {
              if (bTimerStart) {
                if (!bTimerPause)
                  doTimerPause();
                else
                  doTimerResume();
              }
            }
            break;
        }

        break;
      case 1://change font
        changeFontIndex(-1);
        break;
    }
    if (debugindex >= 0)
      debugindex--;

  })
// VolumeMute  a.k.a scoll wheel press
  const vmret = globalShortcut.register('VolumeMute', () => {
    console.log('VolumeMute' + ' is pressed')
    switch (selectedFunction) {
      case 0://Next option
        switch (selectedMenuPage) {
          case 0://normal info
            break;;
          case 1://timer
            TimerOptionUpdate(1);
            break;
        }
        break;
      case 1:
        //changeFontIndex(-1);
        break;
    }
  });
//Scrolllock button, no function for now
  const slret = globalShortcut.register('Scrolllock', () => {
    console.log('Scrolllock' + ' is pressed')
    switch (selectedFunction) {
      case 0://Next option
        switch (selectedMenuPage) {
          case 0://normal info
            break;
          case 1://timer
            break;
        }
        break;
      case 1:
        //changeFontIndex(-1);
        break;
    }
  });
//MediaNextTrack a.k.a double click media control button, Next menu
  const mntret = globalShortcut.register('MediaNextTrack', () => {
    console.log('MediaNextTrack' + ' is pressed')
    ChangeFunction(1);
  })

//MediaPreviousTrack a.k.a Triple click  media control button, Previous menu
  const mptret = globalShortcut.register('MediaPreviousTrack', () => {
    console.log('MediaPreviousTrack' + ' is pressed')
    ChangeFunction(-1);
  })

//MediaPlayPause a.k.a single click media control button, it is the "Enter" button.
  const mppret = globalShortcut.register('MediaPlayPause', () => {
    console.log('MediaPlayPause' + ' is pressed')
    switch (selectedFunction) {
      case 0://main menu
        ChangeManupage();
        break;
      case 1:
        changeFont();
        selectedFunction = 0; // change it back to main menu
        break;
    }
  })

  const quitret = globalShortcut.register('Ctrl+Alt+MediaPlayPause', () => {
    console.log('Ctrl+Alt+MediaPlayPause' + ' is pressed');
    quitapp();
    app.quit()

  })


  if (!nsret)
    console.log('ns registration failed')
  if (!psret)
    console.log('ps registration failed')
  if (!mntret)
    console.log('mnt registration failed')
  if (!mptret)
    console.log('mptret registration failed')
  //#endregion

  console.log("Gettiong all font data");

  await getAllFontData();

  console.log("All font data got");

  for (let i = 0; i < AllfontPngName.length; i++) {
    if (AllfontPngName[i] == settingjson.font) {
      fontindex = i;
      console.log("AllfontPngName : " + fontindex);
      //changeFont();
      i = 9999;
    }
  }
  //setup keyboard display event;
  keyboardSetup();

};

function updateMenu() {
  var template = [
    {
      id: '1', label: 'Update Temperature', click: () => {
        GetCurrrentTemp();
      }
    },
    { id: '2', label: 'Exit App', click: () => { quitapp(); app.quit() } }
  ]
  const ctxMenu = Menu.buildFromTemplate(template);
  app.Tray.setContextMenu(ctxMenu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
//app.on('ready', createWindow);
app.on('ready', noWindowMode);

app.on('will-quit', () => {
  // Unregister a shortcut.
  //globalShortcut.unregister(shortcutKeys)
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();

})
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    quitapp();
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    //createWindow();
  }
});


function quitapp() {
  quitting = true;
  ScreenUpdate();
}

//#endregion

//#region Png and FontTable Set up

function getAllFontData() {
  return new Promise((resolve, reject) => {
    //setup all font table 
    fs.readdir(__dirname + '\\Font\\', async (err, files) => {
      for (let i = 0; i < files.length; i++) {
        console.log("files[i] : " + files[i]);
        AllfontPngName.push(files[i]);
        await getImageData(__dirname + '\\Font\\' + files[i]);
        console.log("files[i] end: " + files[i]);
      }
      resolve();
    });
  });
}


var AllfontPngName = new Array();
var AllfontData = new Array();
var fontData = new Array();
//get png data
function getImageData(pngdir) {
  return new Promise((resolve, reject) => {
    //Get png data
    var RawPngData = new Array();
    new PNG(pngdir).then(value => {
      fontData = new Array();
      console.log(pngdir + " data.length : " + value.data.length + " width : " + value.width + " height : " + value.height);
      //set data only look the r channel
      for (let i = 0; i < value.data.length; i += 4) {
        RawPngData.push(value.data[i]);
      }
      var rawbyte = new Array();
      var RawPngDataIndex = 0; //( blockrow + ( blockcol * 128 ) + ( TableRow * 8 ) + ( TableCol * 10 * 128 ))
      //The Table 128*130 | TableCol index (0-12) | TableRow index (0-15)
      for (let TableCol = 0; TableCol < (value.height / 10); TableCol++) {
        for (let TableRow = 0; TableRow < (value.width / 8); TableRow++) {

          //Small Block for one letter (8*10) | blockcol index (0-9) | blockrow index (0-7)
          for (let blockcol = 0; blockcol < 10; blockcol++) {
            for (let blockrow = 0; blockrow < 8; blockrow++) {

              RawPngDataIndex = (blockrow + (blockcol * value.width) + (TableRow * 8) + (TableCol * 10 * value.width));
              // console.log("blockrow : " + blockrow + ' RawPngDataIndex : ' + RawPngDataIndex + ' cbyte : ' + cbyte);
              rawbyte.push(RawPngData[RawPngDataIndex] > 125 ? '1' : '0');

            }
            //console.log("blockcol : " + blockcol);
          }
          //After getting one letter, assign to fontData
          //console.log("rawbyte : " + rawbyte);
          fontData.push({ 'data': rawbyte });
          rawbyte = new Array();

        }
        //console.log("TableCol : " + TableCol);

      }
      console.log('RawPngData : ' + RawPngData.length);
      console.log('fontData : ' + fontData.length);
      console.log('fontData Last : ' + fontData[fontData.length - 1].data);
      AllfontData.push(fontData);
      resolve("GG");
      //console.log('AllfontData : ' + AllfontData.length);
    });

  });

}

function getFontTableData(inputvalue, fontsizex, fontsizey, customfont, fontid) {
  for (let i = 0; i < fontTable.length; i++) {
    if (fontTable[i].value == inputvalue)
      return RawDataFontSizeHolder(fontTable[i].index, fontsizex, fontsizey, customfont, fontid);
  }
  console.log("Input value not found, returning last data");
  return RawDataFontSizeHolder(fontTable[fontTable.length - 1].index, fontsizex, fontsizey, customfont, fontid);
}

function RawDataFontSizeHolder(inputvalue, fontsizex, fontsizey, customfont, fontid) {

  var returndata = new Array();
  var yindexbuffer = 1;
  var localfontData = customfont ? AllfontData[fontid] : AllfontData[fontindex];
  var baseindex = 8;
  for (let yindex = 0; yindex < 8 * fontsizey; yindex++) {


  }


  for (let i = 0; i < (localfontData[inputvalue].data.length); i++) {

    //console.log('i : ' + i + " dataindex : " + Math.floor(dataindex));
    for (let sizepush = 0; sizepush < fontsizex; sizepush++) {
      //console.log('push : ' + sizepush);
      returndata.push(localfontData[inputvalue].data[i]);
    }

    if (yindexbuffer % 8 == 0) {
      //console.log('yindexbuffer : ' + yindexbuffer);
      for (let yindex = (yindexbuffer - 8); yindex < (8 * (fontsizey - 1)) + (yindexbuffer - 8); yindex++) {
        //console.log('yindex : ' + yindex);
        for (let sizepush = 0; sizepush < fontsizex; sizepush++) {
          // console.log('push : ' + sizepush);
          returndata.push(localfontData[inputvalue].data[yindex]);

        }
      }
    }

    yindexbuffer++;


  }

  //console.log('returndata : ' + returndata.length + " fontData[inputvalue].data : " + fontData[inputvalue].data.length);
  return returndata;

}

//#endregion

//#region Input Index Change
function ChangeManupage() {
  selectedMenuPage += 1;
  if (selectedMenuPage >= numberOfPageInManu)
    selectedMenuPage = 0;
  else if (selectedMenuPage < 0)
    selectedMenuPage = numberOfPageInManu - 1;
}

function ChangeFunction(dir) {
  selectedFunction += dir;
  if (selectedFunction >= numberOfFunction)
    selectedFunction = 0;
  else if (selectedFunction < 0)
    selectedFunction = numberOfFunction - 1;
  //OLEDEvent.value = selectedFunction;

  // console.log('currentFunctionIndex : ' + currentFunctionIndex);
  console.log('selectedFunction : ' + selectedFunction);
  // console.log('blinkEvent : ' + blinkEvent.value);
}

var fontindex = 0;
function changeFontIndex(dir) {

  fontindex = fontindex - dir;
  if (fontindex == AllfontData.length)
    fontindex = 0;
  else if (fontindex < 0)
    fontindex = AllfontData.length - 1;

}

function changeFont() {
  fontData = AllfontData[fontindex];
  //(__dirname + '\\Font\\' + AllfontPngName[fontindex]
  settingjson.font = AllfontPngName[fontindex];
  fs.writeFile(__dirname + '\\setting.json', JSON.stringify(settingjson), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(settingjson));
    console.log('writing to ' + __dirname + '\\setting.json');
  });

}
//#endregion

//#region Keyboard Function Set up
var OLEDEvent, BlinkEvent, client;

function keyboardSetup() {
  console.log("doing keyboardSetup");
  /**
   * Setup the web server endpoint to the local GameSense(TM) Engine.
   * A url parameter is optional.
   * @type {gamesense.ServerEndpoint}
   */
  var endpoint = new gamesense.ServerEndpoint();
  /**
   * Let's automatically discover the GameSense(TM) Engine web server url.
   */
  endpoint.discoverUrl();

  /**
   * Setups our unique game.
   * @type {gamesense.Game}
   */
  var game = new gamesense.Game('KEYBOARD_APPS', 'A KEYBOARD APPS', gamesense.Color.SILVER);

  /**
   * Create a client for our game and the local GameSense(TM) Engine web server.
   * @type {gamesense.GameClient}
   */
  client = new gamesense.GameClient(game, endpoint);

  /**
   * Setup of our OLED event.
   * @type {gamesense.GameEvent}
   */
  OLEDEvent = new gamesense.GameEvent('IS_OLED_ACTIVE');


  /**
   * Setup of our Blink event.
   * @type {gamesense.GameEvent}
   */
  BlinkEvent = new gamesense.GameEvent('IS_BLINK_ACTIVE');

  /**
   * Let's setup and start everything.
   * The SteelSeries GameSense� SDK is not very exact about the ordering of the different steps.
   * So let's wait on every request for the response to start the next step. The gamesense-client
   * provides Promises to do this in a very easy way.
   */
  client.registerGame()
    .then(bindOLEDHandler)
    .then(startOLEDEventUpdates)
    .catch(function (error) {
      console.log(error);
    });

  // client.registerGame()
  //   .then(bindBlinkHandler)
  //   .catch(function (error) {
  //     console.log(error);
  //   });

  keyboardFunctionEnable = true;
}

//#endregion

//#region Keyboard event handlers
function bindOLEDHandler() {
  /**
   * Setup of a event handler for the keyboard device and the function key zone.
   * @type {gamesense.ScreenEventHandler}
   */
  //var functionKeysEventHandler = new gamesense.ColorEventHandler(gamesense.DeviceType.KEYBOARD, gamesense.RgbPerKeyZone.ESCAPE, blinkColor);
  var functionKeysEventHandler = new Array(new gamesense.ScreenEventHandler(gamesense.DeviceType.SCREENED128x40, gamesense.ScreenZone.ONE));

  return client.bindEvent(OLEDEvent, functionKeysEventHandler);
}

var keyboardcolorEventHandler = new Array();

function bindBlinkHandler() {
  /**
   * Setup of a event handler for the keyboard device and the function key zone.
   * @type {gamesense.ScreenEventHandler}
   */
  //var functionKeysEventHandler = new Array();//new gamesense.ColorEventHandler(gamesense.DeviceType.KEYBOARD, 'f1', blinkColor), new gamesense.ColorEventHandler(gamesense.DeviceType.KEYBOARD, 'f2', blinkColor));
  for (let i = 0; i < keyboardClockJSON.index.length; i++) {
    console.log("keyboardClockJSON : " + i + ' ' + keyboardClockJSON.col[i].green);
    keyboardcolorEventHandler.push(new gamesense.ColorEventHandler(gamesense.DeviceType.RgbPerKeyZone, keyboardClockJSON.keycaps[i], null, keyboardClockJSON.col[i]));
  }

  //keyboardcolorEventHandler.push(new gamesense.ColorEventHandler(gamesense.DeviceType.RgbPerKeyZone, null, [26, 4, 22, 7], keyboardClockJSON.col[0]));

  return client.bindEvent(BlinkEvent, keyboardcolorEventHandler);
  //return client.bindEvent(BlinkEvent, [functionKeysEventHandler]);

}
function startOLEDEventUpdates() {
  OLEDEvent.value = 0;
  updateOLEDEventID = setInterval(updateOLEDEvent, 1000 / fps);
}
function startBlinkEventUpdates() {

  BlinkEvent.value = selectedFunction;
  updateBlinkEventID = setInterval(updateBlinkEvent, 1000);
}
function updateOLEDEvent() {

  OLEDEvent.value = (OLEDEvent.value == 1) ? (OLEDEvent.value - 1) : (OLEDEvent.value + 1);//for telling keyboard to update;
  //BlinkEvent.value = 1;
  //BlinkEvent.value = (BlinkEvent.value == 1) ? (BlinkEvent.value - 1) : (BlinkEvent.value + 1);//for telling keyboard to update;


  // var date = new Date();

  // var currenthour = date.getHours();
  // var currentminute = date.getMinutes();
  // var currentsecond = date.getSeconds();

  // var hourindex = currenthour == 0 ? 12 : (currenthour > 12 ? (currenthour - 12) : currenthour);
  // console.log(hourindex);
  // keyboardClockJSON.col[0].red = (currenthour <= 12 ? 255 : 0);
  // keyboardClockJSON.col[hourindex].green = 255;


  // // keyboardcolorEventHandler = new Array();
  // // for (let i = 0; i < keyboardClockJSON.index.length; i++) {
  // //   console.log("keyboardClockJSON : " + i + ' ' + keyboardClockJSON.col[i].green);
  // //   keyboardcolorEventHandler.push(new gamesense.ColorEventHandler(gamesense.DeviceType.KEYBOARD, keyboardClockJSON.keycaps[i], keyboardClockJSON.col[i]));
  // // }

  // BlinkEvent.frame = { 'test': keyboardClockJSON.keycaps[hourindex], 'color': keyboardClockJSON.col[hourindex] };



  //console.log('blinkEvent.value : ' + blinkEvent.value);
  ScreenUpdate();
  client.sendGameEventUpdate(OLEDEvent);
  //client.sendMultipleEventUpdate(new Array(OLEDEvent, BlinkEvent));
}
function updateBlinkEvent() {
  BlinkEvent.value = (BlinkEvent.value == (selectedFunction + 1) ? (BlinkEvent.value - 1) : (BlinkEvent.value + 1));//for telling keyboard to update;

  var date = new Date();

  var currenthour = date.getHours();
  var currentminute = date.getMinutes();
  var currentsecond = date.getSeconds();

  var hourindex = currenthour == 0 ? 12 : (currenthour - 12);
  //console.log(hourindex);
  keyboardClockJSON.col[0] = new gamesense.Color((currenthour >= 12 ? 255 : 0), 0, 0);
  keyboardClockJSON.col[hourindex] = new gamesense.Color(0, 0, 255);




  client.sendGameEventUpdate(BlinkEvent);

}
//#endregion

var quitting = false;
var timerTimesUp = 0;
var lastSecond = -404;
var osusageDisplay = 'CPU:--% RAM:--%(-/-)';

GetCurrrentTemp();
setInterval(GetCurrrentTemp, 1800000);//Get temperture every 1 hour

function ScreenUpdate() {
  //Clear last frame data
  ClearScreen();

  //#region When Apps quit
  if (quitting) {

    DataInput(1, 1, 2, 12, 'Apps Closing', false);
    PackingRawData();
    OLEDEvent.frame = { "image-data-128x40": ImageDataPacked };
    return;
  }
  //#endregion

  //#region Date time setting
  var date = new Date();

  if (date.getSeconds() != lastSecond) {// update function down below every second 
    lastSecond = date.getSeconds();
    os.cpuUsage(function (v) {
      var cpu = (v * 100).toFixed(0).toString().padStart(2, '0');
      var ram = (os.freememPercentage() * 100).toFixed(0).padStart(2, '0');
      var totalram = Math.round(os.totalmem() / 1024);
      var usedram = Math.round((os.totalmem() / 1024) - (os.freemem() / 1024));
      osusageDisplay = ('CPU:' + cpu + '%' + ' RAM:' + ram + '%(' + usedram + '/' + totalram + ')');
    });
  }

  var currenthour = date.getHours() <= 9 ? "0" + date.getHours() : date.getHours().toString();
  var currentminute = date.getMinutes() <= 9 ? "0" + date.getMinutes() : date.getMinutes().toString();
  var currentsecond = date.getSeconds() <= 9 ? "0" + date.getSeconds() : date.getSeconds().toString();


  var dd = date.getDate().toString().padStart(2, '0');
  var mm = (date.getMonth() + 1).toString().padStart(2, '0'); //January is 0!
  var yyyy = date.getFullYear();
  var week = date.getDay();

  switch (week) {
    case 0:
      week = 'Sun';
      break;
    case 1:
      week = 'Mon';
      break;
    case 2:
      week = 'Tue';
      break;
    case 3:
      week = 'Wed';
      break;
    case 4:
      week = 'Thu';
      break;
    case 5:
      week = 'Fri';
      break;
    case 6:
      week = 'Sat';
      break;
  }

  var clockDisplay = (currenthour + ':' + currentminute + ':' + currentsecond);
  var dateDisplay = week + ' ' + mm + '/' + dd;
  var tempunit = "℃";
  if(settingjson['temperature-unit'] == 'F')
      tempunit = 'F';
  var temperatureDisplay = currentTemp.value + tempunit;
  //#endregion

  //#region OLED Function, Here is the main stage for what text should be display.
  if (powerMonitor.getSystemIdleState(settingjson.idleTime) != 'idle' && powerMonitor.getSystemIdleState(1) != 'locked') {
    switch (selectedFunction) {
      case 0:
        //Clock
        DataInput(2, 2, 32, 2, clockDisplay);
        switch (selectedMenuPage) {
          case 0:
            //Date
            DataInput(1, 1, 0, 22, dateDisplay, true);
            //Temp
            DataInput(1, 1, 108, 22, temperatureDisplay);
            //OS info
            DataInput(1, 1, 0, 32, osusageDisplay);
            break;
          case 1:
            DataInput(1, 1, 0, 12, 'Timer');
            DataInput(1, 1, 74, 22, (bTimerStart ? (bTimerPause ? 'Resume' : 'Pause') : 'Start') + (timerOptionIndex == 4 ? ' <' : ''));
            DataInput(1, 1, 74, 32, bTimerStart ? ('Stop' + (timerOptionIndex == 5 ? ' <' : '')) : '    ');
            let digiindex = timerOptionIndex * 12 + (timerOptionIndex > 1 ? 12 : 0);
            if (timerOptionIndex <= 3)
              DataInput(2, 2, 8 + digiindex, 25, '_');
            if (bTimerStart)
              DataInput(1, 1, 0, 26, '^');

            DataInput(2, 2, 8, 22, `${timerdigis[0]}${timerdigis[1]}:${timerdigis[2]}${timerdigis[3]}`);
            break;
          default:
            DataInput(1, 1, 0, 12, 'Error, Page overloaded');
            break;
        }
        break;
      case 1://font menu
        for (let i = 0; i < AllfontPngName.length; i++) {
          var fontstring = (i + 1) + '. ' + AllfontPngName[i].slice(0, -4);
          if (fontindex == i)
            fontstring += ' <';
          DataInput(1, 1, 2, (i * 10) - (fontindex * 10), fontstring, false, false, true, i);
        }
        break;
      default:
        DataInput(1, 1, 0, 12, 'Error, Menu overloaded');
        break;
    }
  } else {
    //Outline 
    //screenOutLine();
    DVDAnimation(clockDisplay.length, 1, 10, 1, WordSpacing);
    DataInput(1, 1, dvdX, dvdY, clockDisplay, true);
  }

  //positionDebugPixel();
  // This is for the timer event, when timer reach 0, flash the screen
  if (timerTimesUp > 0) {
    if (OLEDEvent.value == 0) {
      timerTimesUp -= 1;
      ScreenFlash();
    }
  }
  PackingRawData();
  //#endregion
  OLEDEvent.frame = { "image-data-128x40": ImageDataPacked };
}

//#region Display control function ==============================================!

var xspeed = 1;
var yspeed = 1;
var init = false;
var dvdX = 0;
var dvdY = 0;

function DVDAnimation(stringw, wsize, stringh, hsize, spacing) {
  var xmax = ((stringw * spacing) * wsize) + stringw;
  var ymax = stringh * hsize;
  if (!init) {
    init = true;
    dvdX = Math.round(Math.random() * (128 - xmax));
    dvdY = Math.round(Math.random() * (39 - ymax));
    xspeed = Math.random() > 0.5 ? 1 : -1;
    yspeed = Math.random() > 0.5 ? 1 : -1;

  }
  //console.log('imgindexx : ' + imgindexx + ' imgindexy : ' + imgindexy);

  if (dvdX == 0)
    xspeed = 1;
  else if (dvdX == (128 - xmax))
    xspeed = -1;

  if (dvdY == 0)
    yspeed = 1;
  else if (dvdY == (40 - ymax))
    yspeed = -1;

  dvdX = dvdX + (xspeed);
  dvdY = dvdY + (yspeed);

}

function ScreenFlash() {
  for (let temp = 0; temp < ImageDataRaw.length; temp++) {
    ImageDataRaw[temp] = 1;//default value;
  }
}

var debugindex = 0;
function positionDebugPixel() {
  console.log('debugindex : ' + debugindex);
  ImageDataRaw[debugindex] = 1;
}

var tempmarqueeoffset = 0;
var tempmarqueelenght = 0;
function DataInput(fontsizeX, fontsizeY, offsetX, offsetY, inputstrings, wrap = false, marquee = false, customfont = false, fontid = 0) {

  if (marquee) {
    tempmarqueelenght = (inputstrings.length + 1) * WordSpacing * fontsizeX;
    inputstrings = inputstrings + '|' + inputstrings;
    offsetX -= tempmarqueeoffset;

    tempmarqueeoffset++;
    //console.log("tempmarqueeoffset : " + tempmarqueeoffset + "inputstrings " + inputstrings.length);
    if (tempmarqueeoffset >= tempmarqueelenght)
      tempmarqueeoffset = 0;
  }

  for (let displayi = 0; displayi < inputstrings.length; displayi++)
    GetRawDataInput((displayi * WordSpacing * fontsizeX) + offsetX, offsetY, fontsizeX, fontsizeY, getFontTableData(inputstrings[displayi], fontsizeX, fontsizeY, customfont, fontid), wrap);
}

function pixelIndex(col, row) {
  return (col * 16) + row;
}

function ClearScreen() {

  for (let temp = 0; temp < ImageDataRaw.length; temp++) {
    ImageDataRaw[temp] = 0;//default value;
  }
}

function GetRawDataInput(startx, starty, fontsizex, fontsizey, inputdata, wrap) {

  //if(x < 0) && x > 127
  //if(y < 0) && y > 39

  // default size of x = 8, y = 10
  var TotalXStep = 8 * fontsizex;
  var TotalYStep = 10 * fontsizey;

  // x step = 1, down step = 128
  var ImgStartIndexX = (startx * 1);
  var ImgStartIndexY = (starty * 128);

  var currentImgIndex;
  var currentInputIndex;

  var YOverflow = false;
  var XOverflow = false;

  //Loop all the Y
  for (let InputY = 0; InputY < TotalYStep; InputY++) {
    var currentImgStepY = ImgStartIndexY + (InputY * 128);
    if (currentImgStepY >= 0 && currentImgStepY <= (39 * 128)) {
      YOverflow = false;
    } else {
      YOverflow = true;
      currentImgStepY = (ImgStartIndexY - (40 * 128)) + (InputY * 128);//if wrap enabled, offset to y = 0 position
      //console.log("Y overflow currentImgStepY : " + currentImgStepY);
    }
    if (!YOverflow || wrap) { // if wrap around enabled, igrone Y overflow
      for (let InputX = 0; InputX < TotalXStep; InputX++) {//Loop all the X

        var currentImgStepX = ImgStartIndexX + (InputX * 1);

        if (currentImgStepX >= 0 && currentImgStepX <= 127) {
          XOverflow = false;
        } else {
          XOverflow = true;
          currentImgStepX = (ImgStartIndexX - 128) + (InputX * 1);//if wrap enabled, offset to X = 0 position
          //console.log("X overflow currentImgStepY : " + currentImgStepX);
        }

        if (!XOverflow || wrap)// if wrap round enabled, igrone x overflow
        {
          currentImgIndex = currentImgStepX + currentImgStepY;
          currentInputIndex = InputX + (InputY * TotalXStep);
          InputDataApplyToImgData(currentImgIndex, currentInputIndex, inputdata);
        }

      }
    }

  }

  //console.log('ImageDataRaw : ' + ImageDataRaw.length);
}

function InputDataApplyToImgData(imgindex, inputindex, inputdata) {
  var temp = (inputdata[inputindex] + ImageDataRaw[imgindex]);
  ImageDataRaw[imgindex] = temp >= 1 ? 1 : 0;//Overlap all pixel

}

function PackingRawData() {

  var cbyte = 0;
  var pbyte = '';
  var packedbyte = '';
  var packedImageIndex = 0;
  for (let imgindex = 0; imgindex < ImageDataRaw.length; imgindex++) {
    cbyte++;
    pbyte += ImageDataRaw[imgindex];
    if (cbyte == 8) {
      //console.log(imgindex + " packed : " + pbyte + " as int : " + Number.parseInt(pbyte, 2));
      //packedbyte.push(Number.parseInt(pbyte, 2));
      packedbyte = Number.parseInt(pbyte, 2);
      pbyte = '';
      cbyte = 0;
      ImageDataPacked[packedImageIndex] = packedbyte;
      //console.log(packedImageIndex + " ImageDataPacked : " + ImageDataPacked[packedImageIndex]);
      packedImageIndex++;
      // packedbyte = new Array();
    }
  }
  //console.log('ImageDataPacked : ' + ImageDataPacked.length);

}

var ImageDataRaw = new Array(5120);
var ImageDataPacked = new Array(640);

var fontTable = new Array();

for (let i = 0; i < fontjson.index.length; i++) {
  fontTable.push({ 'index': fontjson.index[i], 'value': fontjson.value[i] });
}

//#endregion

//#region Weather Function
var currentTemp = { value: -404, unit: 'C' };

function GetCurrrentTemp() {

  var unit = 'celsius';
  if(settingjson['temperature-unit'] != 'C'){
    unit = 'fahrenheit';
  }
  var apiurl = 'https://api.open-meteo.com/v1/forecast?latitude='+settingjson.latitude+'&longitude='+settingjson.longitude+'&current_weather=true&temperature_unit='+unit;
  console.log(apiurl);
  fetch(apiurl)//get temp
    .then(res => res.json())
    .then(data => {
      //console.log(data.current_weather.temperature);
      currentTemp.value = Math.floor(data.current_weather.temperature);
    })
    .catch(error => console.log('ERROR'));
}

//#endregion

//#region Timer Function

var bTimerStart = false;
var bTimerPause = false;

var timerOptionIndex = 0, totaltimerOption = 6;

var countdowntimer = 0;
var timerdigis = new Array(0, 0, 0, 0);
var timerStartdigis = new Array(0, 0, 0, 0);
var timerUpdateID;

function TimerOptionUpdate(dir) {
  timerOptionIndex = timerOptionIndex + dir;
  if (timerOptionIndex == (bTimerStart ? totaltimerOption : totaltimerOption - 1))
    timerOptionIndex = 0;
  else if (timerOptionIndex < 0)
    timerOptionIndex = totaltimerOption - 1;
}

function TimerDigiUpdate(dir) {
  timerdigis[timerOptionIndex] += dir;

  if (timerdigis[timerOptionIndex] > ((timerOptionIndex == 2) ? 5 : 9))
    timerdigis[timerOptionIndex] = 0;
  else if (timerdigis[timerOptionIndex] < 0)
    timerdigis[timerOptionIndex] = ((timerOptionIndex == 2) ? 5 : 9);
}

function doTimerStart() {
  if (!bTimerStart) {
    console.log("doTimerStart");
    for (let i = 0; i < timerdigis.length; i++)
      timerStartdigis[i] = timerdigis[i];
    countdowntimer = (timerStartdigis[0] * 600) + (timerStartdigis[1] * 60) + (timerStartdigis[2] * 10) + (timerStartdigis[3] * 1);
    timerUpdateID = setInterval(TimerUpdate, 1000);
    bTimerStart = true;
  }

}

function doTimerPause() {
  console.log("doTimerPause");
  bTimerPause = true;
  clearInterval(timerUpdateID);
}

function doTimerResume() {
  console.log("doTimerResume");
  bTimerPause = false;
  timerUpdateID = setInterval(TimerUpdate, 1000);
}

function doTimerStop() {
  console.log("doTimerStop");
  bTimerStart = false;
  for (let i = 0; i < timerdigis.length; i++)
    timerdigis[i] = timerStartdigis[i];

  TimerOptionUpdate((timerOptionIndex == totaltimerOption - 1) ? -1 : 0);

  clearInterval(timerUpdateID);

}

function TimerUpdate() {
  if (countdowntimer > 0)
    countdowntimer -= 1;
  else {
    bTimerStart = false;
    doTimerStop();
    timerTimesUp = settingjson.fps * 2;
    return;
  }
  timerdigis[0] = Math.floor(countdowntimer / 600);
  timerdigis[1] = Math.floor((countdowntimer - (timerdigis[0] * 600)) / 60);
  timerdigis[2] = Math.floor((countdowntimer - (timerdigis[0] * 600) - (timerdigis[1] * 60)) / 10);
  timerdigis[3] = Math.floor((countdowntimer - (timerdigis[0] * 600) - (timerdigis[1] * 60) - (timerdigis[2] * 10)) / 1);

}

//#endregion

//#region other function

function keyboardDisable() {
  keyboardShutingDown = true;
  updateOLEDEvent();
  client.removeGame().then(() => {
    keyboardFunctionEnable = false;
    console.log("keyboard Disabled");
    keyboardShutingDown = false;
    clearInterval(updateOLEDEventID);
  }).catch(function (error) {
    console.log(error);
  });
}
//#endregion

//#region useless tabel

//#endregion