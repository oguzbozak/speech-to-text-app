/* src/App.js */
import React, { useEffect, useState } from 'react'
import Amplify, { API, graphqlOperation } from 'aws-amplify'
import { createTodo } from './graphql/mutations'
import { listTodos } from './graphql/queries'
import { Storage } from 'aws-amplify'
import { withAuthenticator } from '@aws-amplify/ui-react'

import awsExports from "./aws-exports";
Amplify.configure(awsExports);

const initialState = { name: '', description: '', file: '' }

const getTableContent = (todos) => {
  const iterateItem = (todos) => {
     return todos.map(function (todo, j) {
       return (
          <tr key={todo.name}>
             <td>{todo.name}</td>
             <td>{todo.description}</td>
             <td> <a href={todo.fileUrl} target='_blank'>{todo.fileName}</a></td>
          </tr>
       );
     })
  }
  return (
      <table key="todo-table">
      <thead><br></br><b>Yüklenen Dosyalar</b></thead>
          <tbody>
              {iterateItem(todos)}
          </tbody>
      </table>
  );
};


const App = () => {
  const [formState, setFormState] = useState(initialState)
  const [todos, setTodos] = useState([])

  useEffect(() => {
    fetchTodos()
  }, [])

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value })
  }

  async function fetchTodos() {
    try {
      const todoData = await API.graphql(graphqlOperation(listTodos))
      const todos = todoData.data.listTodos.items

      for(var todo of todos){
        todo.fileUrl = await Storage.get(
          todo.fileName,
          {
            level: 'private'
          },
        )
      }

      setTodos(todos)
    } catch (err) { console.log('error fetching todos') }
  }

  async function addTodo() {
    try {
      if (!formState.name || !formState.description) return
      Storage.put(formState.file.name, formState.file, {
        level: 'private',
        progressCallback(progress) {
          console.log(`Uploaded: ${progress.loaded}/${progress.total}`);
        },
      })

      const todo = { description: formState.description, name: formState.name, fileName: formState.file.name }
      setTodos([...todos, todo])
      setFormState(initialState)

      await API.graphql(graphqlOperation(createTodo, { input: todo }))
    } catch (err) {
      console.log('error creating todo:', err)
    }
  }

  
  return (
    <div style={styles.container}>
      <h2>Lütfen gerekli bilgileri girin</h2>
      <input
        onChange={event => setInput('name', event.target.value)}
        style={styles.input}
        value={formState.name}
        placeholder="Name"
      />
      <input
        onChange={event => setInput('description', event.target.value)}
        style={styles.input}
        value={formState.description}
        placeholder="Description"
      />
      <input
        type="file"
        style={styles.input}
        onChange={event => setInput('file', event.target.files[0])}
      />
      <button style={styles.button} onClick={addTodo}>Upload file</button>
      {
         <div>{getTableContent(todos)}</div>
      }
    </div>
  )
}

const styles = {
  container: { width: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 20 },
  todo: { marginBottom: 15 },
  input: { border: 'none', backgroundColor: '#ddd', marginBottom: 10, padding: 8, fontSize: 18 },
  todoName: { fontSize: 20, fontWeight: 'bold' },
  todoDescription: { marginBottom: 0 },
  button: { backgroundColor: 'black', color: 'white', outline: 'none', fontSize: 18, padding: '12px 0px' }
}

export default withAuthenticator(App);