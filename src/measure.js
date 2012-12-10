/**
 * Measure - intermediate representation of measures of a Vex.Flow.Document
 * @author Daniel Ringwalt (ringw)
 */

/** @constructor */
Vex.Flow.Measure = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to Vex.Flow.Measure");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
              "Measure must be initialized with nonzero num_beats and beat_value");
  this.time = object.time;

  this.attributes = {};
  if (typeof object.attributes == "object")
    Vex.Merge(this.attributes, object.attributes);
  this.parts = new Array(1); // default to 1 part
  if (object.parts instanceof Array) {
    this.parts.length = object.parts.length;
    for (var i = 0; i < object.parts.length; i++)
      this.parts[i] = new Vex.Flow.Measure.Part(object.parts[i]);
  }

  // Properties which begin with an underscore should NOT be serialized
  this._vexflowStaves = null;

  this.type = "measure";
}

Vex.Flow.Measure.prototype.setAttributes = function(attributes) {
  Vex.Merge(this.attributes, attributes);
}

Vex.Flow.Measure.prototype.getNumberOfParts = function(numParts) {
  return this.parts.length;
}
Vex.Flow.Measure.prototype.setNumberOfParts = function(numParts) {
  this.parts.length = numParts;
}

Vex.Flow.Measure.prototype.getPart = function(partNum) {
  if (! this.parts[partNum]) {
    // Create empty part
    this.parts[partNum] = new Vex.Flow.Measure.Part({time: this.time});
  }
  return this.parts[partNum];
}
Vex.Flow.Measure.prototype.setPart = function(partNum, part) {
  if (this.parts.length <= partNum)
    throw new Vex.RERR("ArgumentError", "Set number of parts before adding part");
  this.parts[partNum] = new Vex.Flow.Measure.Part(part);
}

Vex.Flow.Measure.prototype.getNumberOfStaves = function() {
  // Sum number of staves from each part
  var totalStaves = 0;
  for (var i = 0; i < this.getNumberOfParts(); i++)
    totalStaves += this.getPart(i).getNumberOfStaves();
  return totalStaves;
}
Vex.Flow.Measure.prototype.getStave = function(staveNum) {
  var firstStaveForPart = 0;
  for (var i = 0; i < this.getNumberOfParts(); i++) {
    var part = this.getPart(i);
    if (firstStaveForPart + part.getNumberOfStaves() > staveNum)
      return part.getStave(staveNum - firstStaveForPart);
  }
  return undefined;
}

/**
 * Add a note to the end of the voice.
 * This is a convenience method that only works when there is one part and
 * one voice. If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.prototype.addNote = function(note) {
  if (this.getNumberOfParts() != 1)
    throw new Vex.RERR("ArgumentError", "Measure.addNote requires single part");
  this.getPart(0).addNote(note);
}

/**
 * Vex.Flow.Measure.Part - a single part (which may include multiple staves/voices)
 * @constructor
 */
Vex.Flow.Measure.Part = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
                       "Constructor requires nonzero num_beats and beat_value");
  this.time = object.time;
  if (object.voices instanceof Array) {
    this.voices = new Array(object.voices.length);
    for (var i = 0; i < object.voices.length; i++)
      this.voices[i] = new Vex.Flow.Measure.Voice(object.voices[i]);
  }
  else this.voices = new Array(1); // Default to single voice
  if (object.staves instanceof Array) {
    this.staves = new Array(object.staves.length);
    for (var i = 0; i < object.staves.length; i++)
      this.staves[i] = new Vex.Flow.Measure.Stave(object.staves[i]);
  }
  else if (typeof object.staves == "number")
    this.staves = new Array(object.staves);
  else this.staves = new Array(1);

  this.type = "part";
}

Vex.Flow.Measure.Part.prototype.getNumberOfVoices = function(numVoices) {
  return this.voices.length;
}
Vex.Flow.Measure.Part.prototype.setNumberOfVoices = function(numVoices) {
  this.voices.length = numVoices;
}
Vex.Flow.Measure.Part.prototype.getVoice = function(voiceNum) {
  if (! this.voices[voiceNum]) {
    // Create empty voice
    this.voices[voiceNum] = new Vex.Flow.Measure.Voice({time: this.time});
  }
  return this.voices[voiceNum];
}
Vex.Flow.Measure.Part.prototype.setVoice = function(voiceNum, voice) {
  if (this.voices.length <= voiceNum)
    throw new Vex.RERR("ArgumentError", "Set number of voices before adding voice");
  this.voices[voiceNum] = new Vex.Flow.Measure.Voice(voice);
}

Vex.Flow.Measure.Part.prototype.getNumberOfStaves = function(numStaves) {
  return this.staves.length;
}
Vex.Flow.Measure.Part.prototype.setNumberOfStaves = function(numStaves) {
  this.staves.length = numStaves;
}
Vex.Flow.Measure.Part.prototype.getStave = function(staveNum) {
  if (! this.staves[staveNum]) {
    // Create empty stave
    this.staves[staveNum] = new Vex.Flow.Measure.Stave({time: this.time});
  }
  return this.staves[staveNum];
}
Vex.Flow.Measure.Part.prototype.setStave = function(staveNum, stave) {
  if (this.staves.length <= staveNum)
    throw new Vex.RERR("ArgumentError", "Set number of staves before adding stave");
  this.staves[staveNum] = new Vex.Flow.Measure.Stave(stave);
}

/**
 * Add a note to the end of the voice.
 * This is a convenience method that only works when the part only has
 * one voice. If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.Part.prototype.addNote = function(note) {
  if (this.getNumberOfVoices() != 1)
    throw new Vex.RERR("ArgumentError", "Measure.addNote requires single part");
  this.getVoice(0).addNote(note);
}

/**
 * Vex.Flow.Measure.Voice - a voice which contains notes, etc
 * @constructor
 */
Vex.Flow.Measure.Voice = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
                       "Constructor requires nonzero num_beats and beat_value");
  this.time = object.time;
  // etc
  if (object.notes instanceof Array) {
    this.notes = new Array(object.notes.length);
    for (var i = 0; i < object.notes.length; i++)
      this.notes[i] = new Vex.Flow.Measure.Note(object.notes[i]);
  }
  else this.notes = new Array();

  // Voice must currently be on a single stave
  if (typeof object.stave == "number") this.stave = object.stave;
  else this.stave = 0;

  this._vexflowVoice = null;
  this._vexflowObjects = null;

  this.type = "voice";
}

/**
 * Add a note to the end of the voice.
 * If there is no room for the note, a Vex.RuntimeError is thrown.
 * @param {Object} Note object
 */
Vex.Flow.Measure.Voice.prototype.addNote = function(note) {
  // TODO: Check total ticks in voice
  this.notes.push(new Vex.Flow.Measure.Note(note));
}

/**
 * Create a Vex.Flow.Voice with a StaveNote for each note.
 * Each note is added to the proper Vex.Flow.Measure.Stave in staves
 * (spanning multiple staves in a single voice not currently supported by VexFlow.)
 * @param {Array} Staves to add the notes to
 */
Vex.Flow.Measure.Voice.prototype.getVexflowVoice = function(staves) {
  if (! this._vexflowVoice) {
    var voice = new Vex.Flow.Voice({num_beats: this.time.num_beats,
                                    beat_value: this.time.beat_value,
                                    resolution: Vex.Flow.RESOLUTION});
    this._vexflowObjects = new Array();
    var beamedNotes = undefined;
    for (var i = 0; i < this.notes.length; i++) {
      var note = this.notes[i];
      var vfNote = this.notes[i].getVexflowNote();
      voice.addTickable(vfNote);
      if (note.beam == "begin") beamedNotes = [vfNote];
      else if (beamedNotes) {
        beamedNotes.push(vfNote);
        if (note.beam == "end") {
          this._vexflowObjects.push(new Vex.Flow.Beam(beamedNotes));
          beamedNotes = undefined;
        }
      }
    }
    this._vexflowVoice = voice;
  }
  return this._vexflowVoice;
}

/**
 * Returns an array of objects such as beams which are created from the
 * VexFlow voice returned from getVexflowVoice. If the VexFlow voice has not
 * been created, the arguments are required and are passed to getVexflowVoice.
 */
Vex.Flow.Measure.Voice.prototype.getVexflowObjects = function(staves) {
  if (! this._vexflowVoice) this.getVexflowVoice(staves);
  return this._vexflowObjects;
}

/**
 * Vex.Flow.Measure.Stave - represent one "stave" for one measure
 * (corresponds to a Vex.Flow.Stave)
 * @constructor
 */
Vex.Flow.Measure.Stave = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (! object.time || ! object.time.num_beats || ! object.time.beat_value)
    throw new Vex.RERR("ArgumentError",
                       "Constructor requires nonzero num_beats and beat_value");
  this.time = object.time;
  this.modifiers = new Array();
  if (object.modifiers instanceof Array) {
    for (var i = 0; i < object.modifiers.length; i++)
      this.addModifier(object.modifiers[i]);
  }

  this._x = this._y = this._width = 0;
  this._height = undefined;
  this._vexflowStave = null;

  this.type = "stave";
}
/**
 * Adds a modifier (clef, etc.), which is just a plain object with a type
 * and other properties.
 */
Vex.Flow.Measure.Stave.prototype.addModifier = function(modifier) {
  // TODO: Verify that the modifier is correct
  this.modifiers.push(modifier);
}

Vex.Flow.Measure.Stave.prototype.getX = function() { return this._x; }
Vex.Flow.Measure.Stave.prototype.setX = function(x) { this._x = x; }
Vex.Flow.Measure.Stave.prototype.getY = function() { return this._y; }
Vex.Flow.Measure.Stave.prototype.setY = function(y) { this._y = y; }
Vex.Flow.Measure.Stave.prototype.getWidth = function() { return this._width; }
Vex.Flow.Measure.Stave.prototype.setWidth = function(width) { this._width = width; }
Vex.Flow.Measure.Stave.prototype.getHeight = function() {
  // Get height of dummy stave
  if (! this._height) this._height = (new Vex.Flow.Stave(0, 0, 500)).getHeight();
  return this._height;
}

/**
 * Creates a Vex.Flow.Stave, or returns the existing one if this method was
 * already called. x, y, width are required if the method was not already invoked.
 */
Vex.Flow.Measure.Stave.prototype.getVexflowStave = function() {
  if (! this._vexflowStave) {
    this._vexflowStave = new Vex.Flow.Stave(this._x, this._y, this._width);
    // TODO: Add modifiers, etc
  }
  return this._vexflowStave;
}

/**
 * Vex.Flow.Measure.Note - a single note (includes chords, rests, etc.)
 * @constructor
 */
Vex.Flow.Measure.Note = function(object) {
  if (typeof object != "object")
    throw new Vex.RERR("ArgumentError", "Invalid argument to constructor");
  if (object.keys instanceof Array)
    // Copy keys array
    // TODO: check each element
    this.keys = object.keys.slice();
  else this.keys = new Array();
  this.duration = object.duration;
  this.stem_direction = object.stem_direction;
  this.beam = object.beam;

  this._vexflowNote = null;

  this.type = "note";
}

Vex.Flow.Measure.Note.prototype.getVexflowNote = function() {
  if (! this._vexflowNote) {
    var note_struct = {};
    note_struct.keys = this.keys;
    note_struct.duration = this.duration;
    if (this.stem_direction) note_struct.stem_direction = this.stem_direction;
    this._vexflowNote = new Vex.Flow.StaveNote(note_struct);
  }
  return this._vexflowNote;
}