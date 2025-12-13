const Jasmine = require('jasmine');
const jasmine = new Jasmine();
const JasmineReporters = require('jasmine-reporters');

jasmine.loadConfigFile('jasmine.json');

jasmine.addReporter(
  new JasmineReporters.JUnitXmlReporter({
    savePath: '.',
    consolidateAll: false,
  })
);

jasmine.execute();
