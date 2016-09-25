(function(ext) {
    var device = null;
    var rawData = null;

  
    var inputs = {
        'button-A': 0,
        'button-B': 0,
        'P0': "",
        'P1':"",
        'P2':"",
        'A+B':""
    };

    ext.resetAll = function(){};

    // Reporters
  
    ext.button_A = function()  { return getSensor('button-A'); };
    ext.button_B = function()  { return getSensor('button-B'); };
    ext.getP0 = function()  { return getSensor('P0'); };
    ext.getP1 = function()  { return getSensor('P1'); };
    ext.getP2 = function()  { return getSensor('P2'); };
    ext.getAB = function()  { return getSensor('A+B'); };

    function getSensor(whichSensor) {
 //         console.log('whichSensor');
        return inputs[whichSensor];
   }
   // Hat blocks

    ext.whenSensorValue = function(whichSensor, s, target) { 
         return device!=null && ('<' == s ? (getSensor(whichSensor) < target) : (getSensor(whichSensor) > target)); 
    };

    ext.getSensorBooleanValue = function(sensorState) { 
		if (device == null) return false;
		if (sensorState == 'A pressed') return getSensor('button-A') == 1;
		if (sensorState == 'B pressed') return getSensor('button-B') == 1;
		return false;
     };
    ext.getbuttonpressedValue = function(sensorState) { 
		if (device == null) return false;
		if (sensorState == 'A pressed') return getSensor('button-A') == 1;
		if (sensorState == 'B pressed') return getSensor('button-B') == 1;
		return false;
     };
    function processData() {
   //    	console.log('process data');
        var from_MB = "";
        from_MB = bin2string(rawData); 
        console.log(from_MB);
        switch (parseInt(from_MB)){
            case 1:
                inputs['button-A'] = 1;
                inputs['button-B'] = 0;
                break;
            case 2:
                inputs['button-A'] = 0;
                inputs['button-B'] = 1;
                break;
            case 3:
                inputs['button-A'] = 0;
                inputs['button-B'] = 0;
                inputs['P0'] = from_MB;
                break;
            case 4:
                inputs['button-A'] = 0;
                inputs['button-B'] = 0;
                inputs['P1'] = from_MB;
                break;
            case 5:
                inputs['button-A'] = 0;
                inputs['button-B'] = 0;
                inputs['P2'] = from_MB;
                break;
            case 6:
                inputs['button-A'] = 0;
                inputs['button-B'] = 0;
                inputs['A+B'] = from_MB;
             }
        rawData = null;
    }
    function bin2string(array){
        var result = "";
        for(var i = 0; i < array.byteLength; ++i){
            result+= (String.fromCharCode(array[i]));
        }
	    console.log(result);
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

            ['b', 'button %m.key?',	'getbuttonpressedValue',		'A pressed'],

            ['r', 'P0',		'getP0'],
            ['r', 'P1',		'getP1'],
            ['r', 'P2',		'getP2'],
            ['r', 'AB',	'getAB'],
            ['r', 'A',	'button_A'],
            ['r', 'B',	'button_B']
        ],
        menus: {
            key: ['A pressed', 'B pressed'],
            sensor: ['P0', 'light', 'sound', 'resistance-A', 'resistance-B', 'resistance-C', 'resistance-D'],
            lessMore: ['<', '>']
        },
        url: 'http://info.scratch.mit.edu/Sensor_Board'
    };
    ScratchExtensions.register('Microbit', descriptor, ext, {type: 'serial'});
})({});
