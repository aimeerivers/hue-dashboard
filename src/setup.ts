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

export const findHueBridgeIpAddress = () => {
  return findPossibleHueBridgeIpAddresses().then(addresses => {
    return Promise.any(
      addresses.map(
        address => hueBridgeResponds(address.internalipaddress).then(() => address)
      )
    );
  });
};

const hueBridgeResponds = (ipAddress: string) => new Promise<boolean>((resolve, reject) => {
  const options = {
    host: ipAddress,
    path: '/debug/clip.html',
    port: 80,
    method: 'GET'
  };

  const req = http.request(options, function(response) {
    if (response.statusCode == 200) resolve(true);
    else reject();
  });

  req.on('error', function () {
    reject();
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
