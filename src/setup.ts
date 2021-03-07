import https from 'https';

export const hueBridgeIpAddressAcquired = () => {
  return false;
};

export const hueBridgeApiKeyGenerated = () => {
  return false;
};

export const hueBridgeResponding = () => {
  return false;
};

export const findHueBridgeIpAddress = () => new Promise((resolve, reject) => {
  const options = {
    host: 'discovery.meethue.com',
    path: '/',
    port: 443,
    method: 'GET'
  };

  const req = https.request(options, function(response) {
    console.log(`${response.statusCode} ${response.statusMessage}`);

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
