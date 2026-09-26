import { useEffect, useState } from 'react'
import axios from 'axios'
import Notification from './components/Notification'

const Filter = ( { filter, handleFilterChange}) => {
  return (
    <div>
      Filter: <input
        value={filter}
        onChange={handleFilterChange}
      />
    </div>
  )
}

// Lomake kerää uuden henkilön nimen ja puhelinnumeron.
// Lomakkeen tilat ja tapahtumankäsittelijät tulevat App-komponentilta.
const PersonForm = ({
  newName,
  newNumber,
  handleNameChange,
  handleNumberChange,
  addPerson}) => {
    return (
      // onSubmit käynnistää addPerson-funktion.
      // Funktio käsittelee lomakkeen lähettämisen.
      <form onSubmit={addPerson}>
        <div>
          Name: <input
            value={newName}
            onChange={handleNameChange}
          />
        </div>
        <div style={{height: '20px'}}>
        </div>
        <div>
          Number: <input
            value={newNumber}
            onChange={handleNumberChange}
          />

        <div style={{height: '20px'}}>
        </div>
        </div>
          <button type="submit">add</button>       
      </form>
    )
  }

// Persons saa henkilölistan ja poistofunktion propsien kautta.
// Jokainen henkilö näytetään omana kappaleenaan.
const Persons = ({persons, removePerson}) => {
  return (
    <div>
        {persons.map(person => 
        <p key={person.name}>{person.name} {person.phone} 
        <button onClick={() => removePerson(person.name)}>remove</button></p>
        )}

    </div> 
  )
}


const App = () => {
  const [persons, setPersons] = useState([])  // persons sisältää kaikki puhelinluettelon henkilöt.
  const [newName, setNewName] = useState('') // newName ja newNumber sisältävät lomakkeen tämänhetkiset arvot.
  const [newNumber, setNewNumber] = useState('')
  const [filter, setFilter] = useState('') // filter sisältää hakukentän tekstin.
  const [message, setMessage] = useState(null)
  const [messageType, setMessageType] = useState('notification')

// useEffect suoritetaan kerran komponentin latautuessa.
// Tyhjä riippuvuuslista [] tarkoittaa, ettei pyyntöä tehdä uudelleen
// jokaisen renderöinnin yhteydessä.
  useEffect(() => {
    // GET-pyyntö hakee henkilöt json-serveriltä.
    axios
      .get('http://localhost:3001/persons')
      .then(response => {
        // Palvelimen vastaus muutetaan sovelluksen käyttämään muotoon.
        // number-kenttä nimetään sovelluksessa phone-kentäksi.
        const personsFromServer = response.data.map(person => ({
          id: person.id,
          name: person.name,
          phone: person.number ?? person.phone
        }))
        // Haetut henkilöt tallennetaan Reactin tilaan.
        setPersons(personsFromServer)
      })
  }, [])

  const addPerson = (event) => {
    // Estetään selaimen normaali lomakkeen lähetys,
    // joka muuten lataisi sivun uudelleen.
    event.preventDefault()

    if (!newName.trim()) {
      setMessage('Name is required')
      setMessageType('error')
      setTimeout(() => setMessage(null), 5000)
      return
    }

    if (!newNumber.trim()) {
      setMessage('Phone number is required')
      setMessageType('error')
      setTimeout(() => setMessage(null), 5000)
      return
    }
    // Luodaan uusi henkilö lomakkeen tietojen perusteella.
    const personObject = {
      id: persons.length + 1,
      name: newName,
      phone: newNumber
    }
  
    const person = persons.find(person => person.name === newName)
    if (person) {
      const replaceNumber =window.confirm(
        `${newName} is already added on a phonebook, are you sure you want to replace the number?`
      )
      if (!replaceNumber) {
          return
      }

      axios
        .put (`http://localhost:3001/persons/${person.id}`, {
          id: person.id,
          name: person.name,
          number: newNumber
        })
        
        .then (() => {
          setPersons(persons.map(currentPerson => {
            return currentPerson.id !== person.id ? currentPerson : { ...currentPerson, phone: newNumber }
          }))
          setNewName('')
          setNewNumber('')
          setMessage(`${newName} number updated.`)
          setMessageType('notification')
          setTimeout(() => {
            setMessage(null)
          }, 5000)
        })
        
      return
    }
    
    axios
      .post('http://localhost:3001/persons', {
        id: personObject.id,
        name: personObject.name,
        number: personObject.phone
      })

      .then (response => {
        // Palvelimen vastaus sisältää tallennetun henkilön id:n.
        // Uusi henkilö lisätään myös Reactin omaan tilaan,
        // jotta lista päivittyy heti ilman uutta GET-pyyntöä.
        setPersons(persons.concat({ ...personObject, id: response.data.id }))
        setNewName('')
        setNewNumber('')
        setMessage (
          `${newName} added to phonebook`
        )
        setMessageType('notification')
        setTimeout(() => {
          setMessage(null)
        }, 5000)

      console.log(response.data)
      })
      
      .catch ((error) => {
        console.error(error)
        setMessage(`Failed to add ${newName}. Try again.`)
        setMessageType('error')
        setTimeout(() => {
          setMessage(null)
        }, 5000)
      })
      
  }

  const removePerson = (name) => {
    // Etsitään poistettava henkilö nimen perusteella.
    const person = persons.find(person => person.name === name)
      // Pyydetään käyttäjältä vahvistus ennen poistamista.
      if (window.confirm(`Remove ${name}?`)) {
        // DELETE-pyyntö poistaa henkilön palvelimelta tämän id:n avulla.
        axios
          .delete (`http://localhost:3001/persons/${person.id}`)
          .then (() => {
            // Poistetaan henkilö myös Reactin tilasta.
            // filter palauttaa uuden listan ilman poistettua henkilöä.
            setPersons(persons.filter(currentPerson => {
              return currentPerson.id !== person.id //Säilytä henkilö, jos hänen id:nsä ei ole sama kuin poistettavan henkilön id.

            }))
            setMessage (
              `${name} removed from phonebook`)
            setMessageType ('error')
            setTimeout(() => {
              setMessage(null)
            }, 5000)

          })

      }
  }
  // Tallennetaan käyttäjän kirjoittama hakuteksti filter-tilaan.
  const handleFilterChange = (event) => {
    console.log(event.target.value)
    setFilter(event.target.value)
  }
  // Luodaan lista henkilöistä, joiden nimi sisältää hakutekstin.
  // toLowerCase tekee hausta kirjainkoosta riippumattoman.
  const personsToShow = persons.filter(person =>
  person.name.toLowerCase().includes(filter.toLowerCase())
  )

  const handleNameChange = (event) => {
    console.log(event.target.value)
    setNewName(event.target.value)
  }
  const handleNumberChange = (event) => {
    console.log(event.target.value)
    setNewNumber(event.target.value)
  }

  return (
    <div>
      <h1>Phonebook</h1>
      <Notification message={message} type={messageType} />

      <Filter
          filter={filter}
          handleFilterChange={handleFilterChange}
      />

      <h2>Add a new</h2>

      <PersonForm
        newName={newName}
        newNumber={newNumber}
        handleNameChange={handleNameChange}
        handleNumberChange={handleNumberChange}
        addPerson={addPerson}
      />

      <h2>Numbers</h2>

      <Persons persons= {personsToShow} removePerson={removePerson} />
    </div>
  )

}

export default App