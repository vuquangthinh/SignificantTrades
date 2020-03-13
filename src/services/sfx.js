import Tuna from 'tunajs'
import options from '../services/options'

class Sfx {
  constructor() {
    this.timestamp = +new Date()
    window.play = this.tradeToSong.bind(this)
    this.connect()
  }

  connect() {
    this.queued = 0

    this.context = new (window.AudioContext || window.webkitAudioContext)()

    var tuna = new Tuna(this.context)

    this.output = new tuna.PingPongDelay({
      wetLevel: 0.8, //0 to 1
      feedback: 0.005, //0 to 1
      delayTimeLeft: 160, //1 to 10000 (milliseconds)
      delayTimeRight: 80 //1 to 10000 (milliseconds)
    })

    var filter = new tuna.Filter({
      frequency: 1000, //20 to 22050
      Q: 1, //0.001 to 100
      gain: -10, //-40 to 40 (in decibels)
      filterType: 'highpass', //lowpass, highpass, bandpass, lowshelf, highshelf, peaking, notch, allpass
      bypass: 0
    })

    this.output.connect(filter)
    filter.connect(this.context.destination)
  }

  tradeToSong(factor, side) {
    const now = +new Date()

    this.queued++

    setTimeout(() => {
      this.queued--

      if (side) {
        if (factor >= 10) {
          ;[659.26, 830.6, 987.76, 1318.52].forEach((f, i, a) =>
            setTimeout(
              () =>
                this.play(f, 0.05 + Math.sqrt(factor) / 10, 0.1 + factor * 0.1),
              i * 80
            )
          )
        } else if (factor >= 1) {
          ;[659.26, 830.6].forEach((f, i) =>
            setTimeout(
              () =>
                this.play(f, 0.05 + Math.sqrt(factor) / 10, 0.1 + factor * 0.1),
              i * 80
            )
          )
        } else {
          this.play(
            659.26,
            Math.sqrt(factor) / 10,
            0.1 + Math.sqrt(factor) / 10
          )
        }
      } else {
        if (factor >= 10) {
          ;[493.88, 369.99, 293.66, 246.94].forEach((f, i, a) =>
            setTimeout(
              () =>
                this.play(
                  f,
                  0.05 + Math.sqrt(factor) / 10,
                  i > 2 ? 0.1 + factor * 0.1 : 0.2
                ),
              i > 2 ? 80 * 3 : i * 80
            )
          )
        } else if (factor >= 1) {
          ;[493.88, 392].forEach((f, i) =>
            setTimeout(
              () =>
                this.play(f, 0.05 + Math.sqrt(factor) / 10, 0.1 + factor * 0.1),
              i * 80
            )
          )
        } else {
          this.play(
            493.88,
            Math.sqrt(factor) / 10,
            0.1 + Math.sqrt(factor) / 10
          )
        }
      }
    }, this.timestamp - now)

    this.timestamp = Math.max(this.timestamp, now) + (this.queued > 10 ? this.queued > 20 ? 20 : 40 : 80)
  }

  play(frequency, value = 0.5, length = 0.1, type = 'triangle') {
    if (this.context.state !== 'running') {
      return
    }

    const time = this.context.currentTime
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()

    oscillator.frequency.value = frequency
    oscillator.type = type

    oscillator.onended = () => {
      oscillator.disconnect()
    }

    gain.connect(this.output)
    oscillator.connect(gain)
    length *= 1.1

    gain.gain.value = Math.max(0.04, Math.min(2, value)) * options.audioVolume

    gain.gain.setValueAtTime(gain.gain.value, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + length)

    oscillator.start(time)
    oscillator.stop(time + length)
  }

  liquidation(size) {
    const now = +new Date()
    this.queued++

    setTimeout(() => {
      this.queued--;

      ;[329.63, 329.63].forEach((f, i, a) =>
        setTimeout(() => this.play(f, Math.sqrt(size) / 3, 0.25, 'sine'), i * 80)
      )
    }, this.timestamp - now)

    this.timestamp = Math.max(this.timestamp, now) + (this.queued > 10 ? this.queued > 20 ? 20 : 40 : 80)
  }

  disconnect() {
    this.context && this.context.state === 'running' && this.context.close()
  }
}

export default Sfx
