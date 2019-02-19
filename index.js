const ffmpeg = require('fluent-ffmpeg');
const firstVideo = './vid/sample.Avi';
const secondVideo = './vid/sample1.Avi';

const watermarkAddition = require('./addWaterMark');

let start;
let end;

new ffmpeg(firstVideo)
    .input(secondVideo)
    .on('start', (command) => {
        start = new Date();
        console.log('\x1b[34m', 'Executing FFMPEG command.....', command);
    })
    .on('end', (proc, ffmpegData) => {
        // console.log('Process Completed', ffmpegData);
        end = new Date();
        console.log('\x1b[34m', '\nTotal time taken to merge: ', timeConvert(start, end));
        console.log('\x1b[34m','\n********************COMPLETED**********************');
        watermarkAddition();
    })
    .on('progress', (progress) => {
        console.log('\x1b[32m', '\nProcessing: ' + progress.targetSize + ' KB converted');
        console.log('\x1b[32m', '\nPercentage complete: ' + Math.round(progress.percent) + ' %');
    })
    .on('error', (err) => {
        console.err('\x1b[31m', '\Error occured: ', err);
    })
    .mergeToFile('./videos/temp.mp4')

timeConvert = (start, end) => {
    const hours = end.getHours() - start.getHours();
    const minutes = end.getMinutes() - start.getMinutes();
    const seconds = end.getSeconds() - start.getSeconds();
    return (hours ? hours + ' hours' : '') + ' ' + (minutes ? minutes + ' minute/s' : '') + ' ' + (seconds ? seconds + ' second/s' : '')
}