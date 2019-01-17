# homebridge-trendnet-babycam

TRENDnet Baby Cam plugin for [Homebridge](https://github.com/nfarina/homebridge) 

Creates a Switch for that starts/stops the music from the SD card and a temperature sensor

## Configuration

Example:

    "platforms": [
        {
	        "platform": "TrendnetBabyCam",
	        "host": "192.168.100.24",
	        "username": "your-username",
	        "password": "your-password"
        },
    ]


