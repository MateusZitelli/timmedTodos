/**
* @jsx React.DOM
*/

var todos = [
  // {name: "Programar", duration:5},
  // {name: "Fazer funfar", duration:90}
];

function playSound(filename){
  document
    .getElementById("sound")
    .innerHTML='<audio autoplay="autoplay"><source src="' + filename + '.mp3" type="audio/mpeg" /><source src="' + filename + '.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="' + filename +'.mp3" /></audio>';
}

var Todo = React.createClass({
  render: function() {
    function make2Digits(val){
      val = val.toString();
      return (val.length <= 1? '0': '') + val;
    }

    function timeStampToString(stamp) {
      var hours = Math.floor(stamp / 3600);
      var minutes = Math.floor(stamp % 3600 / 60);
      var secounds = (stamp % 60).toString();
      hours = make2Digits(hours);
      minutes = make2Digits(minutes);
      secounds = make2Digits(secounds);
      return hours + ":" + minutes + ":" + secounds;
    };

    var todoClassName = 'todo ' + (this.props.todo.ended ? 'ended' : '')
    var buttonClassName = "button-" + (this.props.todo.paused ? 'play': 'pause');
    var remainingTime = timeStampToString(this.props.todo.remainingTime);
    var buttonText = this.props.todo.paused ? 'Play': 'Pause';
    buttonText = this.props.todo.ended ? 'Parar Alarme' : buttonText;

    return(
      <div className={todoClassName}>
        <h2>{this.props.todo.name}</h2>
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
    var todos = this.props.todos || [];
    todos = todos.map(function(todo, i){
      todo.remainingTime = todo.duration;
      todo.paused = true;
      todo.ended = false;
    });
    return {todos: this.props.todos};
  },
  createTodo: function(todo) {
    var todos = this.state.todos;
    todos.push(todo);
    this.setState({todos: todos});
  },
  removeTodo: function(todoIndex) {
    var todos = this.state.todos;
    var todo = this.refs['todo'+todoIndex];
    if(todo.interval){
      clearInterval(todo.interval);
    }
    if(todo.alarm){
      clearInterval(todo.alarm);
    }
    todos.splice(todoIndex, 1);
    this.setState({todos: todos});
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
  },
  pauseAllTodos: function(){
    for(var i=0;i < this.props.todos.length; i++) {
      this.pauseTodo(i);
    }
  },
  pauseTodo: function(todoIndex){
    var todosState = this.state.todos;
    if(todosState[todoIndex].paused) return;
    var todo = this.refs['todo'+todoIndex];

    clearInterval(todo.interval);
    todo.interval = null;
    todosState[todoIndex].paused = true;
    this.setState({todos: todosState});
  },
  finish: function(todoIndex){
    var todosState = this.state.todos;
    var todo = this.refs['todo'+todoIndex];
    this.pauseTodo(todoIndex);
    todosState[todoIndex].remainingTime = todosState[todoIndex].duration;
    todosState[todoIndex].ended = true;
    clearInterval(todo.interval);
    todo.alarm = setInterval(playSound.bind(this, 'assets/notification'), 1000);
    this.setState({todos: todosState});
  },
  tick: function(todoIndex){
    var todosState = this.state.todos;
    var remainingTime = todosState[todoIndex].remainingTime;
    todosState[todoIndex].remainingTime = remainingTime - 1;
    this.setState({todosState: todosState});
    if(remainingTime - 1 === 0) {
      this.finish(todoIndex);
    }
  },
  resumeTodo: function(todoIndex){
    var todosState = this.state.todos;
    if(!todosState[todoIndex].paused) return;
    var todo = this.refs['todo'+todoIndex];

    this.pauseAllTodos();
    todo.interval = setInterval(this.tick.bind(this, todoIndex), 1000);
    todosState[todoIndex].paused = false;
    this.setState({todos: todosState});
  },
  playPauseTodo: function(todoIndex){
    var todosState = this.state.todos;
    if(todosState[todoIndex].ended){
      var todo = this.refs['todo'+todoIndex];
      todosState[todoIndex].ended = false;
      this.setState({todo: todosState});
      clearInterval(todo.alarm);
      this.moveTodo(todoIndex, 'bottom');
    }else if(todosState[todoIndex].paused){
      this.resumeTodo(todoIndex);
    }else{
      this.pauseTodo(todoIndex);
    }
  },
  render: function() {
    var _this = this;
    this.todos = this.state.todos.map(function(todo, i){
      return(
        <Todo
          ref={'todo'+i}
          key={'todo'+i}
          todo={todo}
          deleteTodo={_this.removeTodo.bind(null, i)}
          moveTo={_this.moveTodo.bind(null, i)}
          pauseAllTodos={_this.pauseAllTodos}
          playPauseTodo={_this.playPauseTodo.bind(null, i)}
          duration={todo.duration}/>
      );
    });

    return(
      <div className="todoList">
        {this.todos}
      </div>
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
      ended:false
    };
    this.refs.name.getDOMNode().value = '';
    this.refs.timepicker.getDOMNode().value = '';
    this.props.createTodo(newTodo);
  },
  componentDidMount: function(){
    $(this.refs.timepicker.getDOMNode()).clockpicker({
      donetext: "Pronto",
      default: "0:50",
      align: 'left',
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
        <h1>TODOs</h1><hr/>
        <TodoList
          ref="todoList"
          todos={this.props.todos}/>
        <TodoForm createTodo={this.createTodo}/>
      </div>
    );
  }
});

React.renderComponent(
  <TodoBox todos={todos}/>,
  document.getElementById('content')
);
