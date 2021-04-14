const AWS = require("aws-sdk"),
  fs = require("fs");
const {
  screeshotdetails
} = require('../models/screeshotdetails');
/// set envairoment virables on the server
// AWS.config.update({ accessKeyId: process.env.access_key_id, secretAccessKey: process.env.secret_access_key, signatureVersion: 'v4', region: 'us-east-2' });
AWS.config.update({
  endpoint: "fra1.digitaloceanspaces.com",
  accessKeyId: "SHB3GOHRZ4NPFYMYS6BU",
  secretAccessKey: "OJs3BdGDlF8iRst7oADWt8z5oIuGHn72YBB/8HY+xII",
  //  signatureVersion: "v4",
});


function uploadScreenshots(buf, masterID, _id) {
  console.log('uploadScreenshots');
  const s3 = new AWS.S3();
  return new Promise((resolve, reject) => {
    const today = new Date(new Date().yyyymmdd()).getTime();
    const now = Date.now();
    s3.putObject({
        Bucket: "employee-screenshots",
        Key: `${masterID}/${_id}/${today}/${now}.jpg`,
        Body: buf,
      },
      async function (err, data) {
        if (err) {
          reject(err);
        }
        const body = {
          screenshoturl: `${masterID}/${_id}/${today}/${now}.jpg`,
          screenshotdate: new Date(),
          masterID,
          employeeid: _id,
          entrydate: today,
          entrytime: now
        };
        const screeshotData = new screeshotdetails(body);
        await screeshotData.save();
        resolve(data);
      }
    );
  });

}

function getScreenshots(managerId, workerID, today) {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3();
    let prefix = `${managerId}/${workerID}`;
    if (today) {
      prefix = `${managerId}/${workerID}/${today}`;
    }

    s3.listObjectsV2({
        Bucket: "employee-screenshots",
        Prefix: prefix,
      },
      function (err, data) {
        if (err) reject(err.stack); // an error occurred

        let arr = [];
        data.Contents.forEach((el) => {
          const url = s3.getSignedUrl("getObject", {
            Bucket: "employee-screenshots",
            Key: el.Key,
            Expires: 300,
          });
          arr.push(url);
          // console.log(url);
          // console.log(el.Key);
        }); // successful response
        resolve(arr);
      }
    );
  });
}

function getAgentTool() {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3();

    s3.listObjectsV2({
        Bucket: "employee-screenshots",
        Prefix: 'Download-Pulseye-Agent/Pulseye Agent Setup.zip',
      },
      function (err, data) {
        if (err) reject(err.stack);
        // an error occurred
        console.log(data)
        let arr = [];
        data.Contents.forEach((el) => {
          const url = s3.getSignedUrl("getObject", {
            Bucket: "employee-screenshots",
            Key: el.Key,
            Expires: 300,
          });
          arr.push(url);
          // console.log(url);
          // console.log(el.Key);
        }); // successful response
        resolve(arr);
      }
    );
  });
}

function getAgentToolLinux() {
  return new Promise((resolve, reject) => {
    const s3 = new AWS.S3();

    s3.listObjectsV2({
        Bucket: "employee-screenshots",
        Prefix: 'Download-Pulseye-Agent/Pulseye Agent Setup_linux.zip',
      },
      function (err, data) {
        if (err) reject(err.stack); // an error occurred

        let arr = [];
        data.Contents.forEach((el) => {
          const url = s3.getSignedUrl("getObject", {
            Bucket: "employee-screenshots",
            Key: el.Key,
            Expires: 300,
          });
          arr.push(url);
          // console.log(url);
          // console.log(el.Key);
        }); // successful response
        resolve(arr);
      }
    );
  });
}

function getPresignedUrlS3(prefix) {
  const s3 = new AWS.S3();
  const url = s3.getSignedUrl("getObject", {
    Bucket: "employee-screenshots",
    Key: prefix,
    Expires: 300
  });
  return url;
}
module.exports = {
  uploadScreenshots,
  getScreenshots,
  getAgentTool,
  getAgentToolLinux,
  getPresignedUrlS3
};