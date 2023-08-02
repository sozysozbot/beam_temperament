const fs = require('fs');
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

const fundamental_frequency = 443.0959607292108;
const frequencies = (base_freq) => freq_ratio.map(x => base_freq * x).filter(fr => fr <= SAMPLING_FREQUENCY / 2);
console.log(frequencies(fundamental_frequency));
const sample_length_in_second = 1;
const samples = Array.from({ length: Math.ceil(sample_length_in_second * SAMPLING_FREQUENCY) }, (_, i) => {
    const second = i / SAMPLING_FREQUENCY;
    // ノコギリ波相当が欲しいので、基本周波数の k 倍の音は振幅を 1/k に削る
    return frequencies(fundamental_frequency)
        .map((freq, i) => Math.sin(second * freq * 2 * Math.PI) / freq_ratio[i])
        .reduce((acc, current) => acc + current, 0);
});

const max = Math.max(...samples);
const min = Math.min(...samples);
// こいつらが Math.pow(2, 28) から -Math.pow(2, 28) の間に収まるぐらいの係数を掛け算して出力
const max_amplitude = Math.max(Math.abs(max), Math.abs(min));
const coefficient = Math.pow(2, 28) / max_amplitude;


let sawtooth_equivalent = new wavefile.WaveFile();
sawtooth_equivalent.fromScratch(1, 44100, '32', samples.map(s => Math.round(s * coefficient)));
fs.writeFileSync("sawtooth_equivalent.wav", sawtooth_equivalent.toBuffer());

