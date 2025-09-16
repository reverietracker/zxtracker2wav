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

class WAVWriter {
    constructor(filename) {
        this.filename = filename;

        this.chip = new AYChip({
            frequency: 1773400,
            sampleRate: SAMPLE_RATE,
            stereoMode: 'acb',
        });

        this.leftBuffer = new Float32Array(SAMPLES_PER_FRAME);
        this.rightBuffer = new Float32Array(SAMPLES_PER_FRAME);
        this.buffers = [this.leftBuffer, this.rightBuffer];
        this.waveLeftBuffer = [];
        this.waveRightBuffer = [];
    }
    writeFrame(frame) {
        for (const [reg, val] of frame) {
            this.chip.setRegister(reg, val);
        }
        this.chip.generate(this.buffers, 0, SAMPLES_PER_FRAME);
        for (let i = 0; i < SAMPLES_PER_FRAME; i++) {
            this.waveLeftBuffer.push(this.leftBuffer[i]*32767);
            this.waveRightBuffer.push(this.rightBuffer[i]*32767);
        }
    }
    close() {
        const wav = new WaveFile();
        wav.fromScratch(2, SAMPLE_RATE, '16', [this.waveLeftBuffer, this.waveRightBuffer]);
        fs.writeFileSync(this.filename, wav.toBuffer());
    }
}

writer = new WAVWriter(outputFile);

if (path.extname(inputFile) == '.stc') {
    const inputBuffer = fs.readFileSync(inputFile);
    const stcModule = readSTC(inputBuffer);
    const engine = new STCEngine(stcModule);

    while (!engine.looped) {
        const frame = engine.getAudioFrame();
        writer.writeFrame(frame);
    }
} else if (path.extname(inputFile) == '.psg') {
    const inputBuffer = fs.readFileSync(inputFile);
    const frames = readPSG(inputBuffer);
    for (const frame of frames) {
        writer.writeFrame(frame);
    }
} else {
    throw new Error("Unknown input file type");
}

writer.close();
