import http from 'http';
import https from 'https';

type Ip = {
  id: string,
  internalipaddress: string
};

type IpList = Array<Ip>;

export const hueBridgeIpAddressAcquired = () => {
  return false;
};

export const hueBridgeApiKeyGenerated = () => {
  return false;
};

export const hueBridgeResponding = () => {
  return false;
};

export const findHueBridgeIpAddress = () => new Promise<Ip>((resolve, _reject) => {
  findPossibleHueBridgeIpAddresses().then(addresses => {
    addresses.forEach(address => {
      hueBridgeResponds(address.internalipaddress).then(() => resolve(address));
    });
    // reject("Could not find Hue Bridge");
  });
});

const hueBridgeResponds = (ipAddress: string) => new Promise<boolean>((resolve, reject) => {
  const options = {
    host: ipAddress,
    path: '/debug/clip.html',
    port: 80,
    method: 'GET'
  };

  const req = http.request(options, function(response) {
    if (response.statusCode == 200) resolve(true);
    else reject(false);
  });

  req.on('error', function () {
    console.log(`Hue Bridge not found at ${ipAddress}`);
  });

  req.end();
});

const findPossibleHueBridgeIpAddresses = () => new Promise<IpList>((resolve, reject) => {
  const options = {
    host: 'discovery.meethue.com',
    path: '/',
    port: 443,
    method: 'GET'
  };

  const req = https.request(options, function(response) {
    if (response.statusCode !== 200) {
      reject(`HTTP response status is ${response.statusCode} ${response.statusMessage}`);
    }

    let str = ''
    response.on('data', function(chunk) {
      str += chunk;
    });

    response.on('end', function() {
      resolve(JSON.parse(str));
    });
  });

  req.end();
});
