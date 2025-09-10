import './App.css';
import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

// Firebase SDK import
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { GoogleAuthProvider, getAuth, signInWithRedirect, onAuthStateChanged, signOut, } from "firebase/auth"

// Firebase 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyBVf30fDIHu9pkzdXIjcZGjEkUCGO1C_YQ",
  authDomain: "todo-list-app-demo-aac73.firebaseapp.com",
  projectId: "todo-list-app-demo-aac73",
  storageBucket: "todo-list-app-demo-aac73.firebasestorage.app",
  messagingSenderId: "385330372955",
  appId: "1:385330372955:web:18b556c6f1482bdf4f7a7e",
  measurementId: "G-G5NPS76ET7"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();
const auth = getAuth(app);

// ✅ 입력 필드 컴포넌트
const TodoItemInputField = (props) => {
  const [input, setInput] = useState("");

  const onSubmit = () => {
    props.onSubmit(input); // 부모(App)로 입력값 전달
    setInput("");          // 입력 필드 초기화
  };

  return (
    <div>
      <TextField
        id="todo-item-input"
        label="Todo Item"
        variant="outlined"
        onChange={(e) => setInput(e.target.value)}
        value={input}
      />
      <Button variant="outlined" onClick={onSubmit}>
        Submit
      </Button>
    </div>
  );
};

// todo item component
const TodoItem = (props) => {
  const style = props.todoItem.isFinished ? { textDecoration: 'line-through' } : {};

  return (
    <li>
      <span
        style={style}
        onClick={() => props.onTodoItemClick(props.todoItem)}
      >
        {props.todoItem.todoItemContent}
      </span>
      <Button
        variant="outlined"
        onClick={() => props.onRemoveClick(props.todoItem)}
      >
        Remove
      </Button>
    </li>
  );
};

// to do list component
const TodoItemList = (props) => {
  const todoList = props.todoItemList.map((todoItem, index) => {
    return (
      <TodoItem
        key={index}
        todoItem={todoItem}
        onTodoItemClick={props.onTodoItemClick}
        onRemoveClick={props.onRemoveClick}
      />
    );
  });

  return (
    <div>
      <ul>{todoList}</ul>
    </div>
  );
};

const TodoListAppBar = (props) => {
  const loginWithGoogleButton = (
    <Button color='inherit' onclick={()=>{
      signInWithRedirect(auth, provider);
    }}>Google로 로그인</Button>
  );
  const logoutButton = (
    <Button color="inherit" onClick={()=>{
      signOut(auth);
    }}>로그아웃</Button>
  );
  const button = props.currentUser === null ? loginWithGoogleButton: logoutButton;
  return (
    <AppBar position = "static">
      <Toolbar>
        <Typography variant = "h6" component="div" sx={{flexGrow: 1}}>
          TO DO LIST APP
        </Typography>
        {button}
      </Toolbar>
    </AppBar>
  )
}


function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [todoItemList, setTodoItemList] = useState([]);

  onAuthStateChanged(auth, (user)=>{
    if (user){
      setCurrentUser(user.uid);
    }else{
      setCurrentUser(null);
    }
  })

  // Firestore에서 데이터를 읽어와 상태 동기화
  const syncTodoItemListStateWithFirestore = () => {
    const q = query(collection(db, "todoItem"), orderBy("createdTime", "desc"));

    getDocs(q).then((querySnapshot) => {
      const firestoreTodoItemList = [];
      querySnapshot.forEach((doc) => {
        firestoreTodoItemList.push({
          id: doc.id,
          todoItemContent: doc.data().todoItemContent,
          isFinished: doc.data().isFinished,
          createdTime: doc.data().createdTime ?? 0,
        });
      });
      setTodoItemList(firestoreTodoItemList);
    });
  };

  // 최초 실행 시 Firestore와 동기화
  useEffect(() => {
    syncTodoItemListStateWithFirestore();
  }, []);

  // add todo
  const onSubmit = async (newTodoItem) => {
    await addDoc(collection(db, "todoItem"), {
      todoItemContent: newTodoItem,
      isFinished: false,
      createdTime: Math.floor(Date.now() / 1000),
    });
    syncTodoItemListStateWithFirestore();
  };

  // 클릭 시 완료 / 미완료
  const onTodoItemClick = async (clickedTodoItem) => {
    const todoItemRef = doc(db, "todoItem", clickedTodoItem.id);
    await setDoc(
      todoItemRef,
      { isFinished: !clickedTodoItem.isFinished },
      { merge: true }
    );
    syncTodoItemListStateWithFirestore();
  };

  // todo remove component
  const onRemoveClick = async (removedTodoItem) => {
    const todoItemRef = doc(db, "todoItem", removedTodoItem.id);
    await deleteDoc(todoItemRef);
    syncTodoItemListStateWithFirestore();
  };

  return (
    <div className="App">
      <TodoListAppBar currentUser={currentUser}/>
      <TodoItemInputField onSubmit={onSubmit} />
      <TodoItemList
        todoItemList={todoItemList}
        onTodoItemClick={onTodoItemClick}
        onRemoveClick={onRemoveClick}
      />
    </div>
  );
}

export default App;
