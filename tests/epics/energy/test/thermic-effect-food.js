/**
 * Thermic Effect of Food (TEF) Calculation
 *
 * TEF represents the energy required to digest, absorb, and metabolize food.
 * Generally accounts for ~10% of Total Energy Expenditure (TEE).
 */

import {sleep} from "../../../utils/async-helper.js";
import {calculateThermicEffectFood} from "../thermic-effect-food.js";

export const mockThermicEffectFoodTest = async () => {
    await sleep(2000);

    const result = calculateThermicEffectFood(2000, 800, 800, 400);

    console.info('calculate Thermic Effect Food =', result);

    return result;
};

mockThermicEffectFoodTest();