import React, { useEffect, useState, useCallback, useLayoutEffect } from 'react'
import Letter, { LetterState } from './Letter'
import { isLegal, isChineseSymbol } from '../../utils/utils'
import useSounds from 'hooks/useSounds'
import style from './index.module.css'
import usePronunciationSound from 'hooks/usePronunciation'

// import { SwitcherStateType, SwitcherDispatchType } from '../../pages/Typing/hooks/useSwitcherState'

// import useSwitcherState from '../../pages/Typing/hooks/useSwitcherState'

const EXPLICIT_SPACE = '␣'
// const RCOUNT = 0
const REPEAT_CNT = 0
const WRONG_CNT = 2
const HIDE_REPEAT_CNT = 1
const Word: React.FC<WordProps> = ({ word = 'defaultWord', onFinish, isStart, wordVisible = true }) => {
  // Used in `usePronunciationSound`.
  const originalWord = word
  // const baseword = word
  let [repeadCount, setRepeadCount] = useState(REPEAT_CNT)
  let [wrongCount, setWrongCount] = useState(WRONG_CNT)
  let [hideRepeadCount, setHideRepeadCount] = useState(HIDE_REPEAT_CNT)
  const [isVisable, setIsVisable] = useState(true)
  const [decWrong, setDecWrong] = useState(false)
  if (!wordVisible) {
    repeadCount = -1
  }

  word = word.replace(new RegExp(' ', 'g'), EXPLICIT_SPACE)
  word = word.replace(new RegExp('…', 'g'), '..')
  // word = word + EXPLICIT_SPACE + word + EXPLICIT_SPACE
  // for (let i = 0; i < RCOUNT; i++) {
  //   word = word + EXPLICIT_SPACE + baseword
  // }

  const [inputWord, setInputWord] = useState('')
  const [statesList, setStatesList] = useState<LetterState[]>([])
  const [isFinish, setIsFinish] = useState(false)
  const [hasWrong, setHasWrong] = useState(false)
  const [playKeySound, playBeepSound, playHintSound] = useSounds()
  const playPronounce = usePronunciationSound(originalWord)

  const onKeydown = useCallback(
    (e) => {
      const char = e.key
      if (char === ' ') {
        // 防止用户惯性按空格导致页面跳动
        e.preventDefault()
        setInputWord((value) => (value += EXPLICIT_SPACE))
        playKeySound()
      }
      if (isChineseSymbol(char)) {
        alert('您正在使用中文输入法输入，请关闭输入法')
      }
      if (isLegal(char) && !e.altKey && !e.ctrlKey && !e.metaKey) {
        setInputWord((value) => (value += char))
        playKeySound()
      } else if (char === 'Backspace') setInputWord((value) => value.substr(0, value.length - 1))
    },
    [playKeySound],
  )

  useEffect(() => {
    if (isStart && !isFinish) window.addEventListener('keydown', onKeydown)

    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [isStart, isFinish, onKeydown])

  useEffect(() => {
    if (isFinish) {
      playHintSound()

      onFinish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinish, hasWrong, playHintSound])

  useEffect(() => {
    if (hasWrong) {
      playBeepSound()
      setTimeout(() => {
        setInputWord('')
        setHasWrong(false)
      }, 300)
    }
  }, [hasWrong, playBeepSound])

  useEffect(() => {
    if (isStart && inputWord.length === 0) {
      playPronounce()
    }
    // SAFETY: Don't depend on `playPronounce`! It will cost audio play again and again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStart, word, inputWord])

  useEffect(() => {
    if (hasWrong) {
      if (decWrong) {
        setDecWrong(false)
        if (wrongCount > 0) {
          setWrongCount(wrongCount - 1)
        } else {
          setRepeadCount(REPEAT_CNT)
          setWrongCount(WRONG_CNT)
          setHideRepeadCount(HIDE_REPEAT_CNT)
          setIsVisable(true)
        }
      }
    }
    // SAFETY: Don't depend on `playPronounce`! It will cost audio play again and again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWrong, decWrong, wrongCount])

  useLayoutEffect(() => {
    let hasWrong = false,
      wordLength = word.length,
      inputWordLength = inputWord.length
    const statesList: LetterState[] = []

    for (let i = 0; i < wordLength && i < inputWordLength; i++) {
      if (word[i] === inputWord[i]) {
        statesList.push('correct')
      } else {
        hasWrong = true
        statesList.push('wrong')
        setHasWrong(true)
        if (repeadCount < 0) {
          setDecWrong(true)
        }
        break
      }
    }

    if (!hasWrong && inputWordLength >= wordLength) {
      if (repeadCount < 0 && hideRepeadCount < 0) {
        setIsFinish(true)
      } else {
        repeadCount >= 0 ? setRepeadCount((c) => c - 1) : setHideRepeadCount((c) => c - 1)
        repeadCount < 0 ? setIsVisable(false) : setIsVisable(true)
        console.log('repead count = ' + repeadCount + '\n')
        setInputWord('')
      }
    }
    setStatesList(statesList)
  }, [inputWord, word, isVisable, repeadCount, hideRepeadCount])

  return (
    <div className={`pt-4 pb-1 flex items-center justify-center ${hasWrong ? style.wrong : ''}`}>
      {/* {console.log(inputWord, word)} */}
      {word.split('').map((t, index) => {
        return (
          <Letter
            key={`${index}-${t}`}
            visible={statesList[index] === 'correct' ? true : isVisable && wordVisible}
            // visible={statesList[index] === 'correct' ? true : wordVisible}
            letter={t}
            state={statesList[index]}
          />
        )
      })}
    </div>
  )
}

export type WordProps = {
  word: string
  onFinish: Function
  isStart: boolean
  wordVisible: boolean
}
export default Word

/**
 * Warning: Can't perform a React state update on an unmounted component.
 * 为 use-sound 未解决的 bug
 */
