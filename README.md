# zxtracker2wav

A command-line tool for converting ZX Spectrum tracker files to .wav or .psg

## Installation

```
npm install -g zxtracker2wav
```

## Usage

```
zxtracker2wav <input file> <output file>

Options:
      --help        Show help                                          [boolean]
      --version     Show version number                                [boolean]
  -r, --samplerate  Playback sample rate               [number] [default: 44100]
  -f, --framerate   Playback frame rate                   [number] [default: 50]
  -c, --clock       AY chip clock speed              [number] [default: 1773400]
  -s, --stereo      Stereo mode - "abc", "acb" (or any other ordering) or "mono"
                                                       [string] [default: "acb"]
```

.stc (Soundtracker) and .psg (AY stream) files are supported as input files. .wav and .psg are supported as output files.
