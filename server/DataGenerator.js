const Chance = require('chance');
const chance = new Chance();

class DataGenerator {
  /**
   * Creates a random collection of objects
   * @param {Number=} size Number of resources in the collection. Defaults to 5
   * @return {Array<Object>} Generated data
   */
  static createCollection(size=5) {
    const result = [];
    for (let i = 0; i < size; i++) {
      result[result.length] = DataGenerator.createResource();
    }
    return result;
  }

  static createResource() {
    const result = {
      id: chance.guid({version: 5}),
      name: chance.name({ middle: true }),
      age: chance.age(),
    };

    return result;
  }
}

module.exports.DataGenerator = DataGenerator;
