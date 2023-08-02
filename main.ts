import fs from 'fs';
const wavefile = require('wavefile');
import { SAMPLING_FREQUENCY, FREQ_RATIO, getOvertoneFrequencies } from './constants';

class Timbre {
    powerSpectrum: (k: number) => number;
    constructor(powerSpectrum: (k: number) => number) {
        this.powerSpectrum = powerSpectrum;
    }

    gen_samples(o: { fundamentalFrequency: number; lengthInSecond: number; }): number[] {
        const fundamental_frequency = o.fundamentalFrequency;
        const sample_length_in_second = o.lengthInSecond;
        const samples = Array.from({ length: Math.ceil(sample_length_in_second * SAMPLING_FREQUENCY) }, (_, i) => {
            const second = i / SAMPLING_FREQUENCY;
            // 基本周波数の k 倍の音は振幅が powerSpectrum(k) 倍になる
            return getOvertoneFrequencies(fundamental_frequency)
                .map((freq, i) => Math.sin(second * freq * 2 * Math.PI) * this.powerSpectrum(FREQ_RATIO[i]))
                .reduce((acc, current) => acc + current, 0);
        });

        const max = samples.reduce((a, b) => Math.max(a, b));
        const min = samples.reduce((a, b) => Math.min(a, b));
        // こいつらが Math.pow(2, 28) から -Math.pow(2, 28) の間に収まるぐらいの係数を掛け算して出力
        const max_amplitude = Math.max(Math.abs(max), Math.abs(min));
        const coefficient = Math.pow(2, 28) / max_amplitude;
        return samples.map(s => Math.round(s * coefficient));
    }
}

const sawToothTimbre = new Timbre((k: number) => 1 / k);

function write_sound_to_file(outPath: string, samples: number[]) {
    let wav = new wavefile.WaveFile();
    wav.fromScratch(1, 44100, '32', samples);
    fs.writeFileSync(outPath, wav.toBuffer());
}

const PITCH_STANDARD = 443.0959607292108;
const SEMITONE_RATIO = Math.pow(FREQ_RATIO[1], 1 / 18); // 1.0579488485113508
console.log(SEMITONE_RATIO);

write_sound_to_file("sawtooth_equivalent.wav", sawToothTimbre.gen_samples({ fundamentalFrequency: PITCH_STANDARD, lengthInSecond: 1 }));

let chromatic_scale_samples: number[] = [];
for (let i = 0; i <= 18; i++) {
    chromatic_scale_samples = [
        ...chromatic_scale_samples,
        ...sawToothTimbre.gen_samples({
            fundamentalFrequency: PITCH_STANDARD * Math.pow(SEMITONE_RATIO, i),
            lengthInSecond: 0.5,
        })
    ];
}

write_sound_to_file("chromatic_scale.wav", chromatic_scale_samples);

function genChord(semitones_arr: number[], outPath: string) {
    const lengthInSecond = 3;
    const samples_arr = semitones_arr.map((semitones: number) => sawToothTimbre.gen_samples({
        fundamentalFrequency: PITCH_STANDARD * Math.pow(SEMITONE_RATIO, semitones),
        lengthInSecond,
    }));
    write_sound_to_file(
        outPath,
        Array.from(
            { length: lengthInSecond * SAMPLING_FREQUENCY },
            (v, i) => semitones_arr.map((_, j) => samples_arr[j][i]).reduce((a, b) => a + b)
        )
    );
}

genChord([0, 18], "chord_18_semitones.wav");
genChord([0, 12], "chord_12_semitones.wav");
genChord([0, 9], "chord_9_semitones.wav");
genChord([0, 7], "chord_7_semitones.wav");
genChord([0, 6, 9], "chord_6_9_semitones.wav");
genChord([0, 3, 6, 18], "chord_3_6_18_semitones.wav");
