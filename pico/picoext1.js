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
    var inputs = {slider: 0,
        light: 0,
        sound: 0,
        button: 0,
        'resistance-A': 0,
        'resistance-B': 0,
        'resistance-C': 0,
        'resistance-D': 0};

    ext.resetAll = function(){};

    // Reporters
    ext.sensor = function(whichSensor) { return getSensor(whichSensor); };

    ext.getButton = function()  { return getSensor('button'); };
    ext.getSlider = function()  { return getSensor('slider'); };
    ext.getSound = function()  { return getSensor('sound'); };
    ext.getLight = function()  { return getSensor('light'); };
    ext.getResistanceA = function()  { return getSensor('resistance-A'); };
    ext.getResistanceB = function()  { return getSensor('resistance-B'); };
    ext.getResistanceC = function()  { return getSensor('resistance-C'); };
    ext.getResistanceD = function()  { return getSensor('resistance-D'); };
   
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
		if (sensorState == 'button pressed') return getSensor('button') < 1;
		if (sensorState == 'A connected') return getSensor('resistance-A') < 10;
		if (sensorState == 'B connected') return getSensor('resistance-B') < 10;
		if (sensorState == 'C connected') return getSensor('resistance-C') < 10;
		if (sensorState == 'D connected') return getSensor('resistance-D') < 10;
		return false;
     };


    var inputArray = [];
    function processData() {
        var bytes = new Uint8Array(rawData);
        for(var i=0; i<9; ++i) {
            var hb = bytes[i*2] & 127;
            var channel = hb >> 3;
            var lb = bytes[i*2+1] & 127;
            inputArray[channel] = ((hb & 7) << 7) + lb;
        }

        for(var name in inputs) {
            var v = inputArray[channels[name]];
            if(name == 'light') {
                v = (v < 25) ? 100 - v : Math.round((1023 - v) * (75 / 998));
            }
            else if(name == 'sound') {
                //empirically tested noise sensor floor
                v = Math.max(0, v - 18)
                v =  (v < 50) ? v / 2 :
                    //noise ceiling
                    25 + Math.min(75, Math.round((v - 50) * (75 / 580)));
            }
            else {
                v = (100 * v) / 1023;
            }

            inputs[name] = v;
        }

        console.log(inputs);
        rawData = null;
    }

    function appendBuffer( buffer1, buffer2 ) {
        var tmp = new Uint8Array( buffer1.byteLength + buffer2.byteLength );
        tmp.set( new Uint8Array( buffer1 ), 0 );
        tmp.set( new Uint8Array( buffer2 ), buffer1.byteLength );
        return tmp.buffer;
    }

    var poller = null;
    ext._deviceConnected = function(dev) {
        console.log('device connected');
        if(device) return;

        device = dev;
        device.open({ stopBits: 0, bitRate: 115200, ctsFlowControl: 0 });
        
        console.log('Port opened');
        device.set_receive_handler(function(data) {
 //           console.log('Received: ' + data.byteLength);
            console.log('in set_receive_handler: ');            
            console.log('Received: ' + data);            
//            if(!rawData || rawData.byteLength == 18) rawData = new Uint8Array(data);
//            else rawData = appendBuffer(rawData, data);

//            if(rawData.byteLength >= 18) {
//                console.log(rawData);
//                processData();
                //device.send(pingCmd.buffer);
 //           }
        });
    console.log('outside handler');
        // Tell the PicoBoard to send a input data every 50ms
        var pingCmd = new Uint8Array(1);
        pingCmd[0] = 1;
//        poller = setInterval(function() {
//            device.send(pingCmd.buffer);
//        }, 50);
        console.log('exit device conn');
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
            ['h', 'when %m.booleanSensor',		'getSensorBooleanValue',	'button pressed'],
            ['h', 'when %m.sensor %m.lessMore %n',      'whenSensorValue',     'slider',	'<',    20],

            ['b', 'sensor %m.booleanSensor?',	'getSensorBooleanValue',		'button pressed'],

            ['r', 'button',		'getButton'],
            ['r', 'slider',		'getSlider'],
            ['r', 'light',		'getLight'],
            ['r', 'sound',		'getSound'],
            ['r', 'resistance-A',	'getResistanceA'],
            ['r', 'resistance-B',	'getResistanceB'],
            ['r', 'resistance-C',	'getResistanceC'],
            ['r', 'resistance-D',	'getResistanceD']


        ],
        menus: {
            booleanSensor: ['button pressed', 'A connected', 'B connected', 'C connected', 'D connected'],
            sensor: ['slider', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
            lessMore: ['<', '>']
        },
        url: 'http://info.scratch.mit.edu/Sensor_Board'
    };
    ScratchExtensions.register('MicroBit', descriptor, ext, {type: 'serial'});
})({});