/**
* @jsx React.DOM
*/

if(!localStorage.todos) {
  localStorage['todos'] = JSON.stringify([]);
}

var fixtureds_todos = [
  //{name:'teste', duration:1}
];

function playSound(filename){
  document
    .getElementById("sound")
    .innerHTML='<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename +'.mp3" /></audio>';
}

function saveStateLocalStorage(state){
  localStorage.todos = JSON.stringify(state);
}

function loadStateLoadStorage(){
  return JSON.parse(localStorage['todos']);
}

function getCurrentTimeStamp(){
  return Math.round(new Date().getTime() / 1000.0);
}

function timeStampToString(stamp) {
  var hours = Math.floor(stamp / 3600);
  var minutes = Math.floor(stamp % 3600 / 60);
  var secounds = (stamp % 60).toString();
  hours = make2Digits(hours);
  minutes = make2Digits(minutes);
  secounds = make2Digits(secounds);
  return hours + ":" + minutes + ":" + secounds;
}

function make2Digits(val){
  val = val.toString();
  return (val.length <= 1? '0': '') + val;
}


var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

var Todo = React.createClass({
  getRemainingTime: function(){
    var todo = this.props.todo;
    if(todo.paused){
      return todo.remainingTime;
    }else{
      return todo.duration - (this.props.now - todo.start);
    }
  },
  componentDidUpdate: function(){
    var todo = this.props.todo;
    if(this.getRemainingTime() === 0 && !todo.ended){
      this.props.finish();
    }
  },
  render: function() {
    var todo = this.props.todo;
    var remainingTime;
    var todoClassName = 'todo ' + (todo.ended ? 'ended' : '')
    var buttonClassName = "button-" + (todo.paused ? 'play': 'pause');
    var buttonText = todo.paused ? 'Play': 'Pause';
    buttonText = todo.ended ? 'Parar Alarme' : buttonText;

    remainingTime = timeStampToString(this.getRemainingTime());

    return(
      <div className={todoClassName}>
        <h2>{todo.name}</h2>
        <p>{remainingTime}</p>
        <button
          className={buttonClassName}
          ref="playPause"
          onClick={this.props.playPauseTodo}>
            {buttonText}
        </button>
        <button className='button-delete'
          onClick={this.props.deleteTodo}>
          X
        </button>
      </div>
    );
  }
});

var TodoList = React.createClass({
  getInitialState: function(){
    var _this = this;
    var todos = this.props.todos || [];
    var state = {};
    var previewsState = loadStateLoadStorage();
    todos = todos.map(function(todo, i){
      todo.remainingTime = todo.duration;
      todo.paused = true;
      todo.start = null;
      todo.ended = false;
      return todo;
    });
    state['todos'] = todos;
    for(var key in previewsState){
      if(state[key]){
        state[key] = state[key].concat(previewsState[key]);
      }else{
        state[key] = previewsState[key];
      }
    }
    this.interval = setInterval(function(){
      _this.setState({now: _this.state.now + 1});
    }, 1000);
    state['now'] = getCurrentTimeStamp();
    return state;
  },
  createTodo: function(todo) {
    var todos = this.state.todos;
    todos.push(todo);
    this.setState({todos: todos});
    saveStateLocalStorage(this.state);
  },
  removeTodo: function(todoIndex) {
    var todos = this.state.todos;
    var todo = this.refs['todo'+todoIndex];
    if(todo.alarm){
      clearInterval(todo.alarm);
    }
    todos.splice(todoIndex, 1);
    this.setState({todos: todos});
    saveStateLocalStorage(this.state);
  },
  moveTodo: function(todoIndex, to){
    var todosState = this.state.todos;
    var todo = todos.splice(todoIndex, 1)[0];
    if(to === 'top'){
      todos.unshift(todo);
    }else if(to === 'bottom'){
      todos.push(todo);
    }
    this.setState({todos: todosState});
    saveStateLocalStorage(this.state);
  },
  pauseTodo: function(todoIndex){
    var todosState = this.state.todos;
    if(todosState[todoIndex].paused) return;

    todosState[todoIndex].paused = true;
    todosState[todoIndex].remainingTime = todosState[todoIndex].duration - (this.state.now - todosState[todoIndex].start);
    this.setState({todos: todosState});
    saveStateLocalStorage(this.state);
  },
  finish: function(todoIndex){
    var todosState = this.state.todos;
    todosState[todoIndex].ended = true;
    this.setState({todos: todosState});
    var todo = this.refs['todo'+todoIndex];
    this.pauseTodo(todoIndex);
    todosState[todoIndex].remainingTime = todosState[todoIndex].duration;
    todo.alarm = setInterval(playSound.bind(this, 'assets/notification'), 1000);
    saveStateLocalStorage(this.state);
  },
  resumeTodo: function(todoIndex){
    var todosState = this.state.todos;
    if(!todosState[todoIndex].paused) return;

    if(todosState[todoIndex].remainingTime == null){
      todosState[todoIndex].start = this.state.now;
    }else{
      todosState[todoIndex].start = this.state.now - todosState[todoIndex].duration + todosState[todoIndex].remainingTime;
    }
    todosState[todoIndex].paused = false;
    this.setState({todos: todosState});
    saveStateLocalStorage(this.state);
  },
  playPauseTodo: function(todoIndex){
    var todosState = this.state.todos;
    if(todosState[todoIndex].ended){
      var todo = this.refs['todo'+todoIndex];
      todosState[todoIndex].ended = false;
      this.setState({todo: todosState});
      saveStateLocalStorage(this.state);
      clearInterval(todo.alarm);
    }else if(todosState[todoIndex].paused){
      this.resumeTodo(todoIndex);
    }else{
      this.pauseTodo(todoIndex);
    }
  },
  render: function() {
    var _this = this;
    todos = this.state.todos.map(function(todo, i){
      return(
        <Todo
          ref={'todo'+i}
          key={'todo'+i}
          todo={todo}
          now={_this.state.now}
          deleteTodo={_this.removeTodo.bind(null, i)}
          moveTo={_this.moveTodo.bind(null, i)}
          playPauseTodo={_this.playPauseTodo.bind(null, i)}
          finish={_this.finish.bind(null, i)}/>
      );
    });

    return(
      <ReactCSSTransitionGroup
        component={React.DOM.div}
        transitionName="list"
        transitionLeave={false}
        className="todoList">
          {todos}
      </ReactCSSTransitionGroup>
    );
  }
});

var TodoForm = React.createClass({
  onSubmit: function(e) {
    e.preventDefault();
    var name = this.refs.name.getDOMNode().value;
    var timeInput = this.refs.timepicker.getDOMNode().value.split(':');
    var hours = parseInt(timeInput[0]);
    var minutes = parseInt(timeInput[1]);
    var timeInSecounds = hours * 3600 + minutes * 60;
    var newTodo = {
      name: name,
      remainingTime: timeInSecounds,
      duration: timeInSecounds,
      paused:true,
      ended:false,
      start:null
    };
    this.refs.name.getDOMNode().value = '';
    this.refs.timepicker.getDOMNode().value = '';
    this.props.createTodo(newTodo);
  },
  componentDidMount: function(){
    $(this.refs.timepicker.getDOMNode()).clockpicker({
      donetext: "Pronto",
      default: "0:50",
      align: 'right',
      placement: 'bottom'
    });
  },
  render: function() {
    return(
      <form className="todoForm" onSubmit={this.onSubmit}>
        <input type="text" ref="name" placeholder="Atividade"></input>
        <input type="text" ref="timepicker" placeholder="Duração"></input>
        <input className="button" value="Criar" type="submit"></input>
      </form>
    );
  }
});

var TodoBox = React.createClass({
  createTodo: function(todo){
    this.refs.todoList.createTodo(todo);
  },
  render: function() {
    return(
      <div className="todoBox">
        <h1>TO DOs</h1>
        <TodoList
          ref="todoList"
          todos={this.props.todos}/>
        <TodoForm createTodo={this.createTodo}/>
      </div>
    );
  }
});

function loadComponent(){
  React.renderComponent(
    <TodoBox todos={fixtureds_todos}/>,
    document.getElementById('content')
  );
  $('#content').animate({'opacity':1}, 1000);
}

loadComponent();