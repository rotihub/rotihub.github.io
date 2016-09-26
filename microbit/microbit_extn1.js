
new (function() {
    var device = null;
    var input = null;
    var poller = null;
    var ext = this;

    ext._deviceConnected = function(dev) {
        if(device) return;

        device = dev;
        device.open();

        poller = setInterval(function() {
            device.read(48,input);
        }, 10);

        setInterval(function() { console.log(input); }, 100);
    };

    ext._deviceRemoved = function(dev) {
        if(device != dev) return;
        device = null;
        stopPolling();
    };

    function stopPolling() {
        if(poller) clearInterval(poller);
        poller = null;
    }

    ext._shutdown = function() {
        if(poller) clearInterval(poller);
        poller = null;

        if(device) device.close();
        device = null;
    }

    ext._getStatus = function() {
        if(!device) return {status: 1, msg: 'Controller disconnected'};
        return {status: 2, msg: 'Controller connected'};
    }

    // Converts a byte into a value of the range -1 -> 1 with two decimal places of precision
    function convertByteStr(byte) { return (parseInt(byte, 16) - 128) / 128; }
    ext.readJoystick = function(name) {
        var retval = null;
        switch(name) {
            case 'leftX': retval = convertByteStr(input[12] + input[13]); break;
            case 'leftY': retval = -convertByteStr(input[14] + input[15]); break;
            case 'rightX': retval = convertByteStr(input[16] + input[17]); break;
            case 'rightY': retval = -convertByteStr(input[18] + input[19]); break;
        }

        // If it's hardly off center then treat it as centered
        if(Math.abs(retval) < 0.1) retval = 0;

        return retval.toFixed(2);
    }

    var descriptor = {
        blocks: [
            ['r', 'get joystick %m.joystickPart', 'readJoystick', 'leftX']
        ],
        menus: {
            joystickPart: ['leftX', 'leftY', 'rightX', 'rightY']
        }
    };
    ScratchExtensions.register('Microbit', descriptor, ext, {type: 'hid',vendor:0x0D28, product:0x0204});
})();
