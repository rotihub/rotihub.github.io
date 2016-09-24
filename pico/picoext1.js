(function(ext) {
    var device = null;
    var rawData = null;

    // Sensor states:
    var channels = {
        slider: 7,
        light: 5,
        sound: 6,
        button: 3,
        'resistance-A': 4,
        'resistance-B': 2,
        'resistance-C': 1,
        'resistance-D': 0
    };
    var inputs = {
        'button-A': 0,
        'button-B': 0};

    ext.resetAll = function(){};

    // Reporters
  
    ext.buttonA = function()  { return getSensor('button-A'); };
    ext.buttonB = function()  { return getSensor('button-B'); };
    
    function getSensor(whichSensor) {
          console.log('whichSensor');
        return inputs[whichSensor];
   }
   // Hat blocks

    ext.whenSensorValue = function(whichSensor, s, target) { 
         return device!=null && ('<' == s ? (getSensor(whichSensor) < target) : (getSensor(whichSensor) > target)); 
    };

    ext.getSensorBooleanValue = function(sensorState) { 
		if (device == null) return false;
		if (sensorState == 'A pressed') return getSensor('button-A') = 1;
		if (sensorState == 'B pressed') return getSensor('button-B') = 2;
		return false;
     };

    var inputArray = [];
    function processData() {
       	console.log('process data');
        console.log('my stuff' + bin2string(rawData)); 
	console.log(rawData);

            inputs[name] = v;
        }
        rawData = null;
    }
    function bin2string(array){
        var result = "";
        for(var i = 0; i < array.byteLength; ++i){
            result+= (String.fromCharCode(array[i]));
        }
	return result;
    }      
    function appendBuffer( buffer1, buffer2 ) {
        var tmp = new Uint8Array( buffer1.byteLength + buffer2.byteLength );
        tmp.set( new Uint8Array( buffer1 ), 0 );
        tmp.set( new Uint8Array( buffer2 ), buffer1.byteLength );
        return tmp.buffer;
    }

    var poller = null;
    ext._deviceConnected = function(dev) {
        if(device) return;

	device = dev;
        device.open({ stopBits: 0, bitRate: 115200, ctsFlowControl: 0 }, deviceOpened);    
        console.log('Port opened');

        var pingCmd = new Uint8Array(1);
        pingCmd[0] = 1;
        poller = setInterval(function() {
            device.send(pingCmd.buffer);
        }, 50);
    };

   function deviceOpened(dev) {
          device.set_receive_handler(function(data) {
            console.log('Received: ' + data.byteLength);        
		rawData = new Uint8Array(data);  
              processData();
                //device.send(pingCmd.buffer);
//            }
        });
   };
    
    ext._deviceRemoved = function(dev) {
        console.log('device remve');
        if(device != dev) return;
        if(poller) poller = clearInterval(poller);
        device = null;
    };

    ext._shutdown = function() {
         console.log('dev shutd');
       if(device) device.close();
        device = null;
    };

    ext._getStatus = function() {
        if(!device) return {status: 1, msg: 'PicoBoard disconnected'};
        return {status: 2, msg: 'PicoBoard connected'};
    }

//Remember - be very careful with that end of line comma on last block and last menu in the list!

    var descriptor = {
        blocks: [
            ['h', 'when %m.button',		'getSensorBooleanValue',	'A pressed'],
      //      ['h', 'when %m.sensor %m.lessMore %n',      'whenSensorValue',     'slider',	'<',    20],

            ['b', 'button %m.button?',	'getSensorBooleanValue',		'A pressed'],

            ['r', 'P0',		'getP0'],
            ['r', 'slider',		'getSlider'],
            ['r', 'light',		'getLight'],
            ['r', 'sound',		'getSound'],
            ['r', 'resistance-A',	'getResistanceA'],
            ['r', 'resistance-B',	'getResistanceB'],
            ['r', 'resistance-C',	'getResistanceC'],
            ['r', 'resistance-D',	'getResistanceD']


        ],
        menus: {
            button: ['A pressed', 'B pressed'],
            sensor: ['P0', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
            lessMore: ['<', '>']
        },
        url: 'http://info.scratch.mit.edu/Sensor_Board'
    };
    ScratchExtensions.register('Microbit', descriptor, ext, {type: 'serial'});
})({});
