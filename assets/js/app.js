import React from 'react'
import ReactDOM from 'react-dom'
import WelcomePage from './Components/WelcomePage'
import Header from './Components/Header'
import Issue from './Components/Issue'
// import '@instructure/canvas-theme'
import classes from '../css/app.scss';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      "items": []
    }
  }
  render() {
    const items = [];

    loadIssues()

    return(
      <div>
        {items}
      </div>
    )

    // return (
    //   <div className={`${classes.app}`}>
    //     <Header/>
    //     <WelcomePage/>
    //   </div>
    // )
  }
}

function makeString(length) {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charLength = characters.length;

  for(var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charLength));
  }

  return result;
}

function loadIssues() {
    
    for( var i = 0; i < 6; i++) {
      let obj = {
        "title": makeString(5),
        "description": makeString(5),
        "severity": makeString(5)
      }

      // this.items.push(<Issue obj={obj}/>)
      console.log(obj);

    }
}

ReactDOM.render(<App/>, document.getElementById('root'));