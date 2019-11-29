class WebSdkDemo {
  get logDisplay() {
    return document.getElementById('out');
  }

  log(message) {
    const node = this.logDisplay;
    let text = node.innerText;
    if (text) {
      text += '\n';
    }
    text += message;
    node.innerText = text;
  }

  async runDemo() {
    try {
      this.initUi();
      await this.initSdk();
      this.unblockUi();
      // await this.getMain();
      // await this.createMain();
      // await this.basicAuthorization();
    } catch (e) {
      this.log(e.message);
      // console.error(e);
    }
  }

  initUi() {
    document.getElementById('oplist')
    .addEventListener('click', this._apiActionClickHandler.bind(this));
    document.getElementById('clear')
    .addEventListener('click', this._clearLogHandler.bind(this));
  }

  unblockUi() {
    const nodes = document.querySelectorAll('#oplist .api-action-button');
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].removeAttribute('disabled');
    }
  }

  async initSdk() {
    this.log('Initializing WebSDK...');
    await navigator.sdk.ready();
    this.log('WebSDK ready.');
    this.log('Initializing SDK for "my-api"...');
    this.sdk = await navigator.sdk.api('my-api');
    this.log('SDK ready.');
    this.log('============');
  }

  async getMain() {
    // Calling GET endpoint on `/` route
    this.log('Getting data from "/" route...');
    const request = this.sdk.api.get({
      headers: {
        'Accept': 'application/json'
      }
    });
    const response = await request.execute();
    this.log('GET response received with status: ' + response.status);
    this.log('Reading response body...');
    const data = await response.json();
    this.log('Body read.');
    this.log(JSON.stringify(data, null, 2));
    this.log('============');
  }

  async createMain() {
    // Calling POST endpoint on `/` route
    this.log('Posting data to "/" route...');
    const request = this.sdk.api.post({
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'demo-property': 'demo-value'
      })
    });
    const response = await request.execute();
    this.log('POST response received with status: ' + response.status);
    this.log('Reading response body...');
    const data = await response.json();
    this.log('Body read.');
    this.log(JSON.stringify(data, null, 2));
    this.log('============');
  }

  async basicAuthorization() {
    this.log('Setting Basic authorization credentials.');
    const auth = {
      type: 'Basic',
      username: 'demo-user',
      password: 'demo-password'
    };
    this.sdk.auth.setCredentials(auth);
    this.log('============');
    this.log('Getting authorized response (Basic).');
    const request = this.sdk.api.auth.basic.get();
    const response = await request.execute();
    this.log('GET response received with status: ' + response.status);
    this.log('Reading the body...');
    const data = await response.text();
    this.log('Body read.');
    this.log(data);
    this.log('============');
  }

  async getPeople() {
    this.log('Getting a collection of Person.');
    const request = demo.sdk.api.people.get();
    request.query.limit = 20;
    const response = await request.execute();
    this.log('Response received with status: ' + response.status);
    this.log('Reading response body...');
    const data = await response.json();
    this.log('Body read.');
    this.log(JSON.stringify(data, null, 2));
    this.log('============');
  }

  async getPerson() {
    this.log('Getting a Person.');

  }

  _apiActionClickHandler(e) {
    const { target } = e;
    if (target.localName !== 'button') {
      return;
    }
    const { action } = target.dataset;
    this.performAction(action);
  }

  async performAction(action) {
    try {
      await this[action]();
    } catch (e) {
      this.log(e.message);
      // console.error(e);
    }
  }

  _clearLogHandler() {
    const node = this.logDisplay;
    node.innerText = '';
  }
}

const demo = new WebSdkDemo();
window.demo = demo;
demo.runDemo();
