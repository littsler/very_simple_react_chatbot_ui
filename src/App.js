import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import * as FileSaver from 'file-saver'
import './App.css';

async function getBotResponseBackend(prompt, apiKey, temperature, model, messages) {
  try {
    let openaiMessages = messages.map((message)=> {
      return {'role': message.sender === 'bot'? 'assistant': 'user', 'content': message.text};
    });
    openaiMessages.push({'role': 'user', 'content': prompt});
    const response = await fetch("/chat", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        temperature: temperature,
        model: model==='chatgpt'?'gpt-3.5-turbo':'gpt-4',
        messages: openaiMessages,
        api_key: apiKey
      })
    });
    return await response.json();
  } catch (error) {
    console.error('Error:', error);
    return {'sender': 'bot', 'text': 'Something went wrong! Check the console.'}
  }
};

function downloadCSV(messages) {
  let message_lines = messages.map((message)=>{
    return message.sender + '\t' + message.text.replace(/\n/g, ' ').replace(/\r/g, ' ').replace(/\t/g, '    ');
  });
  const csvText = message_lines.join('\n');
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' });
  FileSaver.saveAs(blob, 'history.csv');
}

class ChatBot extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      messages: [], // Holds the history of chat messages
      input: '', // The user input text value
    };
  }

  handleChange = (event) => {
    const value = event.target.value;
    this.setState({ input: value });
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const message = { text: this.state.input, sender: 'user' };
    const temperature = this.props.temperature;
    const apiKey = this.props.apiKey;
    const model = this.props.model;

    this.setState({
      messages: [...this.state.messages, message],
      input: '',
    });

    // Bot response mechanism goes here, you can call an external API or do some other logic to generate response
    getBotResponseBackend(this.state.input, apiKey, temperature, model, this.state.messages).then((botResponse)=>{
      this.setState({
        messages: [...this.state.messages, botResponse],
      });
    });
  };

  render() {
    return (
      <div className="chatbot">
        <div className="messages-container">
          {this.state.messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.sender === 'bot' ? 'bot-message' : 'user-message'}`}
            >
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          ))}
        </div>

        <form onSubmit={this.handleSubmit}>
          <input
            type="text"
            value={this.state.input}
            onChange={this.handleChange}
            placeholder="Type your message here..."
            autoFocus
          />
          <button type="submit">发送</button>
        </form>
        <div><button onClick={() => downloadCSV(this.state.messages)}>导出聊天记录到CSV文件</button></div>
      </div>
    );
  }
}

class Panel extends React.Component {
  handleModelChange = (event) => {
    this.props.onModelChange(event.target.value);
  };

  handleTemperatureChange = (event) => {
    this.props.onTemperatureChange(event.target.value);
  };

  handleApiKeyChange = (event) => {
    this.props.onApiKeyChange(event.target.value);
  };

  render() {
    return (
      <div className="control-panel">
        <h2>Control Panel</h2>
        <form>
          <label htmlFor="model-select">选择模型:</label>
          <select id="model-select" name="model" onChange={this.handleModelChange} value={this.props.model}>
            <option value="chatgpt">ChatGPT</option>
            <option value="gpt4">GPT-4</option>
          </select>

          <label htmlFor="temperature-slider">
            Temperature参数:<span id="temp-display">{this.props.temperature}</span>
          </label>
          <input
            type="range"
            id="temperature-slider"
            name="temperature"
            min="0.0"
            max="2.0"
            step="0.1"
            value={this.props.temperature}
            onChange={this.handleTemperatureChange}
          />

          <label htmlFor="api-key-input">API Key:</label>
          <input
            type="password"
            id="api-key-input"
            name="api-key"
            value={this.props.apiKey}
            onChange={this.handleApiKeyChange}
          />
        </form>
      </div>
    );
  }
}

function App() {
  const [model, setModel] = useState('chatgpt');
  const [temperature, setTemperature] = useState(1.0);
  const [apiKey, setApiKey] = useState('');

  return (
    <div className="app">
      <div className="chatbot-container">
        <ChatBot model={model} temperature={temperature} apiKey={apiKey}/>
      </div>
      <div className="control-panel-container">
        <Panel
          model={model}
          onModelChange={(newModel) => setModel(newModel)}
          temperature={temperature}
          onTemperatureChange={(newTemperature) => setTemperature(parseFloat(newTemperature))}
          apiKey={apiKey}
          onApiKeyChange={(newApiKey) => setApiKey(newApiKey)}
        />
      </div>
    </div>
  );
}

export default App;
