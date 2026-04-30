import { useState } from 'react'
import { useEffect } from 'react'
import { useRef } from 'react'
import './App.css'
import { AnimatePresence, motion, useAnimation } from "framer-motion"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"


function randomInt(max: number) {
  return Math.floor(Math.random() * max);
} 

type User = {
  username: string;
  score: number;
};

function addItem(key : string, item : User) {
  const raw = window.localStorage.getItem(key);
  const list = raw ? JSON.parse(raw) : [];
  list.push(item);
  localStorage.setItem(key, JSON.stringify(list));
}

function getItems(key: string) {
  return JSON.parse(localStorage.getItem(key) ?? '[]');
}

const words = ["tail", "brick", "flame", "crisp", "glove", "plank", "storm", "frost", "blade", "crane"];

function App() {
  const [currWord, setCurrWord] = useState(words[randomInt(words.length)])
  const [currTypedWord, setCurrTypedWord] = useState("")
  const currWordRef = useRef(currWord);
  currWordRef.current = currWord;
  const currTypedWordRef = useRef(currTypedWord);
  currTypedWordRef.current = currTypedWord;

  const [difficulty, setDifficulty] = useState(1)
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  const controls = useAnimation();
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [score, setScore] = useState(0)
  const [username, setUsername] = useState("")

  const leaderboard = "leaderboard"
  const [leaderboardUsers, setLeaderboardUsers] = useState(getItems(leaderboard))

  const inicialGameTimeSeconds = 11;
  const minDifficulty = 1;
  const maxDifficulty = 10;
  const scoreGain = 10;
  const scoreLoss = -10;

  function advanceWord() {
  let nextWordToType = words[randomInt(words.length)];
  while (nextWordToType === currWordRef.current) {
    nextWordToType = words[randomInt(words.length)];
  }
  currTypedWordRef.current = "";
  currWordRef.current = nextWordToType;
  setCurrTypedWord("");
  setCurrWord(nextWordToType);
  }

  const handleDifficultyChange = (number: number) => {
    if (difficulty + number >= minDifficulty && difficulty + number <= maxDifficulty) {
      setDifficulty(difficulty => difficulty + number)
    }
  }

  const handleScoreSubmition = () => {
    addItem(leaderboard, { username: username, score: score });
    setUsername("");
    setLeaderboardUsers(getItems(leaderboard))
  }


  useEffect(() => {
  controls.set({ y: "-100vh" });
     (async () => {
      await controls.start({ y: "100vh", transition: { duration: inicialGameTimeSeconds - difficulty, ease: "linear" } });
      advanceWord();
      if (score > 0)
        setScore(score => score + scoreLoss)
  })();

  return () => {
    controls.set({ y: "100vh" });
    controls.stop()
     const span = charRefs.current[currTypedWordRef.current.length];
          if (span) span.style.color = "coral";
    charRefs.current.forEach(span => { if (span) span.style.color = "black" })
  };
  }, [currWord]);

  useEffect(() => {
  const handleKeyPress = (e : KeyboardEvent) => {
    if (currWordRef.current[currTypedWordRef.current.length] === e.key) {
      if (currWordRef.current.length === currTypedWordRef.current.length + 1) {
        advanceWord();
        setScore(score => score + scoreGain * difficultyRef.current)
      } else {
          setCurrTypedWord(currTypedWordRef => (currTypedWordRef + e.key))
          const span = charRefs.current[currTypedWordRef.current.length];
          if (span) span.style.color = "coral";
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <>
      <div className="grid grid-cols-3 overflow-hidden w-full">
        <div className="flex items-center justify-center h-screen col-span-2 bg-gray-50" >
          <AnimatePresence mode="popLayout">
            <motion.div
              animate={controls} 
            >
            {currWord.split("").map((char, index) => (
              <span className="text-6xl font-bold" key={index}
              ref={el => { charRefs.current[index] = el; }}
              >{char}</span>
            ))}
            </motion.div>
          </AnimatePresence>
        </div>
        <Tabs defaultValue="main" className='w-full h-screen bg-gray-400'>
          <Card className='h-full flex flex-col w-full bg-gray-400'>
            <CardHeader>
              <TabsList>
                <TabsTrigger value="main">Main</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              </TabsList>
            </CardHeader>
            <TabsContent value="main">
              <CardContent className='flex items-center flex-col justify-center text-4xl h-screen'>
                <div className='m-10'>
                  <span className='m-4'>Score:</span>
                  <span>{score}</span>
                </div>
                <div className='flex items-center flex-col'>
                  <span className='m-4'>Speed:</span>
                  <Button onClick={() => handleDifficultyChange(1)}
                  variant="outline" size="icon" aria-label="Increase difficulty">
                    <ArrowUpIcon />
                  </Button>
                  <span>{difficulty}</span>
                  <Button onClick={() => handleDifficultyChange(-1)}
                  variant="outline" size="icon" aria-label="Decrease difficulty">
                    <ArrowDownIcon />
                  </Button>
                </div>
                <div className='m-15 flex items-center flex-col justify-center '>
                  <Field>
                    <FieldLabel htmlFor="input-field-username">Username</FieldLabel>
                    <Input
                      id="input-field-username"
                      type="text"
                      placeholder=""
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <FieldDescription className='text-black-100'>
                      Choose a unique username to submit you score.
                    </FieldDescription>
                  </Field>
                  <Button onClick={() => handleScoreSubmition()} variant="outline" className='m-5'>Submit</Button>
                </div>
              </CardContent>
            </TabsContent>
            <TabsContent value="leaderboard">
              <CardContent className='flex items-center flex-col justify-center h-screen'>
                <Table className='text-lg'>
                  <TableHeader className='font-bold border-b-3 border-border'>
                    <TableRow>
                      <TableHead className='font-extrabold'>Place</TableHead>
                      <TableHead className='font-extrabold'>Username</TableHead>
                      <TableHead className='font-extrabold'>Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {leaderboardUsers.slice(0, 10).sort((user1: User, user2: User) => user2.score - user1.score).map((user : User, index : number) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.score}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>  
              </CardContent>
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </>
  )
}

export default App
