import {useState} from 'react';
import './App.css';
import Map from './map';

function App() {
    // const [resultText, setResultText] = useState("Please enter your name below 👇");
    // const [name, setName] = useState('');
    // const updateName = (e: any) => setName(e.target.value);
    // const updateResultText = (result: string) => setResultText(result);

    return (
        <div id="App">
            <Map/>
        </div>
    )
}

export default App
