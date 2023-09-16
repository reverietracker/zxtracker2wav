#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { readSTC } = require("stcformat");
const { STCEngine } = require("stcengine");
const { AYChip } = require("aychip");
const { WaveFile } = require('wavefile');
const { readPSG } = require('psgformat');

const SAMPLE_RATE = 44100;
const SAMPLES_PER_FRAME = SAMPLE_RATE / 50;

const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 <input file> <output file>')
    .demandCommand(2, 'You must provide input and output files')
    .argv;

const [inputFile, outputFile] = argv._;

const chip = new AYChip({
    frequency: 1773400,
    sampleRate: SAMPLE_RATE,
    stereoMode: 'acb',
});

const leftBuffer = new Float32Array(SAMPLES_PER_FRAME);
const rightBuffer = new Float32Array(SAMPLES_PER_FRAME);
const buffers = [leftBuffer, rightBuffer];
const waveLeftBuffer = [];
const waveRightBuffer = [];

if (path.extname(inputFile) == '.stc') {
    const inputBuffer = fs.readFileSync(inputFile);
    const stcModule = readSTC(inputBuffer);
    const engine = new STCEngine(stcModule);

    while (!engine.looped) {
        const frame = engine.getAudioFrame();
        for ([reg, val] of frame) {
            chip.setRegister(reg, val);
        }
        chip.generate(buffers, 0, SAMPLES_PER_FRAME);
        for (let i = 0; i < SAMPLES_PER_FRAME; i++) {
            waveLeftBuffer.push(leftBuffer[i]*32767);
            waveRightBuffer.push(rightBuffer[i]*32767);
        }
    }
} else if (path.extname(inputFile) == '.psg') {
    const inputBuffer = fs.readFileSync(inputFile);
    const frames = readPSG(inputBuffer);
    for (const frame of frames) {
        for ([reg, val] of frame) {
            chip.setRegister(reg, val);
        }
        chip.generate(buffers, 0, SAMPLES_PER_FRAME);
        for (let i = 0; i < SAMPLES_PER_FRAME; i++) {
            waveLeftBuffer.push(leftBuffer[i]*32767);
            waveRightBuffer.push(rightBuffer[i]*32767);
        }
    }
} else {
    throw new Error("Unknown input file type");
}

const wav = new WaveFile();
wav.fromScratch(2, SAMPLE_RATE, '16', [waveLeftBuffer, waveRightBuffer]);
fs.writeFileSync(outputFile, wav.toBuffer());
