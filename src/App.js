// 스타일 및 라이브러리 import
import './App.css';
import { useEffect, useState } from 'react';
import TextField from '@mui/material/TextField';
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

// Firebase 프로젝트 설정
const firebaseConfig = {
  apiKey: "AIzaSyAPjYrRKj11e85Yx1ZaqFiZ6STbH-ciUT8",
  authDomain: "todo-list-app-98806.firebaseapp.com",
  projectId: "todo-list-app-98806",
  storageBucket: "todo-list-app-98806.appspot.com",
  messagingSenderId: "886143434487",
  appId: "1:886143434487:web:b5227108bd4261291f9df2",
  measurementId: "G-NGJKZTHLQN"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

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

// ✅ 할 일 아이템 컴포넌트
const TodoItem = (props) => {
  // 완료된 아이템은 취소선 표시
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

// ✅ 할 일 리스트 컴포넌트
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

// ✅ 메인 App 컴포넌트
function App() {
  const [todoItemList, setTodoItemList] = useState([]);

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

  // 새 할 일 추가
  const onSubmit = async (newTodoItem) => {
    await addDoc(collection(db, "todoItem"), {
      todoItemContent: newTodoItem,
      isFinished: false,
      createdTime: Math.floor(Date.now() / 1000),
    });
    syncTodoItemListStateWithFirestore();
  };

  // 할 일 완료/취소 토글
  const onTodoItemClick = async (clickedTodoItem) => {
    const todoItemRef = doc(db, "todoItem", clickedTodoItem.id);
    await setDoc(
      todoItemRef,
      { isFinished: !clickedTodoItem.isFinished },
      { merge: true }
    );
    syncTodoItemListStateWithFirestore();
  };

  // 할 일 삭제
  const onRemoveClick = async (removedTodoItem) => {
    const todoItemRef = doc(db, "todoItem", removedTodoItem.id);
    await deleteDoc(todoItemRef);
    syncTodoItemListStateWithFirestore();
  };

  return (
    <div className="App">
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
