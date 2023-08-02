import fs from 'fs';
const wavefile = require('wavefile');
const SAMPLING_FREQUENCY = 44100;

const freq_ratio_sqrt = [
    3.011237462,
    4.99950534,
    7.000021359,
    8.999999077,
    11.00000004,
    13,
    15,
    17,
    19,
    21,
    23,
];

const freq_ratio = freq_ratio_sqrt.map(
    x => x * x / freq_ratio_sqrt[0] / freq_ratio_sqrt[0]
);
console.log(freq_ratio); /* [
    1,
    2.756538507456572,
    5.403917633600124,
    8.932950354131412,
    13.344286696455125,
    18.637887895037807,
    24.813756073275187,
    31.87189113411791,
    39.81229307756597,
    48.63496190361936,
    58.33989761227811
  ] */

function gen_timbre_samples(o: { fundamentalFrequency: number; lengthInSecond: number; powerSpectrum: (k: number) => number; }) {
    const fundamental_frequency = o.fundamentalFrequency;
    const frequencies = (base_freq: number) => freq_ratio.map(x => base_freq * x).filter(fr => fr <= SAMPLING_FREQUENCY / 2);
    const sample_length_in_second = o.lengthInSecond;
    const samples = Array.from({ length: Math.ceil(sample_length_in_second * SAMPLING_FREQUENCY) }, (_, i) => {
        const second = i / SAMPLING_FREQUENCY;
        // 基本周波数の k 倍の音は振幅が powerSpectrum(k) 倍になる
        return frequencies(fundamental_frequency)
            .map((freq, i) => Math.sin(second * freq * 2 * Math.PI) * o.powerSpectrum(freq_ratio[i]))
            .reduce((acc, current) => acc + current, 0);
    });

    const max = samples.reduce((a, b) => Math.max(a, b));
    const min = samples.reduce((a, b) => Math.min(a, b));
    // こいつらが Math.pow(2, 28) から -Math.pow(2, 28) の間に収まるぐらいの係数を掛け算して出力
    const max_amplitude = Math.max(Math.abs(max), Math.abs(min));
    const coefficient = Math.pow(2, 28) / max_amplitude;
    return samples.map(s => Math.round(s * coefficient));
}

function gen_sound(o: { outPath: string, samples: number[] }) {
    let wav = new wavefile.WaveFile();
    wav.fromScratch(1, 44100, '32', o.samples);
    fs.writeFileSync(o.outPath, wav.toBuffer());
}

const PITCH_STANDARD = 443.0959607292108;
const PERIOD = freq_ratio[1]; // 2.756538507456572
const SEMITONE_RATIO = Math.pow(PERIOD, 1 / 18); // 1.0579488485113508
console.log(SEMITONE_RATIO);

gen_sound({ outPath: "sawtooth_equivalent.wav", samples: gen_timbre_samples({ fundamentalFrequency: PITCH_STANDARD, lengthInSecond: 1, powerSpectrum: (k: number) => 1 / k }) });

let chromatic_scale_samples: number[] = [];
for (let i = 0; i <= 18; i++) {
    chromatic_scale_samples = [
        ...chromatic_scale_samples,
        ...gen_timbre_samples({
            fundamentalFrequency: PITCH_STANDARD * Math.pow(SEMITONE_RATIO, i),
            lengthInSecond: 0.5,
            powerSpectrum: (k: number) => 1 / k
        })
    ];
}

gen_sound({ outPath: "chromatic_scale.wav", samples: chromatic_scale_samples });

function genChord(semitones_arr: number[], outPath: string) {
    const lengthInSecond = 3;
    const samples_arr = semitones_arr.map((semitones: number) => gen_timbre_samples({
        fundamentalFrequency: PITCH_STANDARD * Math.pow(SEMITONE_RATIO, semitones),
        lengthInSecond,
        powerSpectrum: (k: number) => 1 / k
    }));
    gen_sound({
        outPath,
        samples: Array.from(
            { length: lengthInSecond * SAMPLING_FREQUENCY },
            (v, i) => semitones_arr.map((_, j) => samples_arr[j][i]).reduce((a, b) => a + b)
        )
    });
}

genChord([0, 18], "chord_18_semitones.wav");
genChord([0, 12], "chord_12_semitones.wav");
genChord([0, 9], "chord_9_semitones.wav");
genChord([0, 7], "chord_7_semitones.wav");
genChord([0, 6, 9], "chord_6_9_semitones.wav");
genChord([0, 3, 6, 18], "chord_3_6_18_semitones.wav");
