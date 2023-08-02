"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOvertoneFrequencies = exports.FREQ_RATIO = exports.FREQ_RATIO_SQRT = exports.SAMPLING_FREQUENCY = void 0;
exports.SAMPLING_FREQUENCY = 44100;
exports.FREQ_RATIO_SQRT = [
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
exports.FREQ_RATIO = exports.FREQ_RATIO_SQRT.map(x => x * x / exports.FREQ_RATIO_SQRT[0] / exports.FREQ_RATIO_SQRT[0]);
console.log(exports.FREQ_RATIO); /* [
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
const getOvertoneFrequencies = (base_freq) => exports.FREQ_RATIO.map(x => base_freq * x).filter(fr => fr <= exports.SAMPLING_FREQUENCY / 2);
exports.getOvertoneFrequencies = getOvertoneFrequencies;
