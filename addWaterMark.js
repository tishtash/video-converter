const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');

let startTime;
let endTime;

module.exports.init = function (path, saveToFolder) {
    new ffmpeg()
        .input(path)
        .input('./watermark/logo.png')
        .addOptions(['-c:v h264', '-preset:v ultrafast'])
        .complexFilter([{
            filter: 'overlay',
            options: 'x=W-w-10:y=h'
        }])
        .on('start', (command) => {
            startTime = new Date();
            console.log('\x1b[34m', '\nAdding Watermark to the video......');
            console.log('\x1b[34m', '\nExecuting FFMPEG command.....', command);
            console.log('\x1b[34m', '\n******************************************');
        })
        .on('end', (proc, ffmpegData) => {
            // console.log('Process Completed', ffmpegData);
            try {
                console.log('\x1b[34m', '\nDeleting Temporary files......');
                fs.unlinkSync(path);
                console.log('\x1b[32m', 'Successfully deleted temp files');
            } catch (err) {
                console.error('\x1b[31m', 'Unable to do the clean up.')
            }
            endTime = new Date();
            console.log('\x1b[34m', '\n********************COMPLETED**********************');
            console.log('\x1b[34m', '\nTotal time taken: ', timeConvert(startTime, endTime));
            console.log('\x1b[34m', '\n******************************************');
        })
        .on('progress', (progress) => {
            console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
            console.log('\x1b[32m', '\nPercentage complete: ' + Math.round(progress.percent) + ' %');
        })
        .on('error', (err) => {
            console.log('\x1b[31m', '\Error occured: ', err);
        })
        .save('./videos' + saveToFolder + '/converted.mp4')
}

timeConvert = (start, end) => {
    const hours = end.getHours() - start.getHours();
    const minutes = end.getMinutes() - start.getMinutes();
    const seconds = end.getSeconds() - start.getSeconds();
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}