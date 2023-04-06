function sendCodeBlockMessage(codeBlock, MAX_MESSAGE_LENGTH) {
  let message = codeBlock;
  let openCodeBlock = false;
  let chunks = [];
  let prevIndex = -1;

  while (message.length > 0) {
    let index = message.indexOf("\n\n", prevIndex + 1);
    let chunkLength = index === -1 ? message.length : index;

    while (chunkLength <= MAX_MESSAGE_LENGTH && index !== -1) {
      prevIndex = index;
      index = message.indexOf("\n\n", index + 2);
      chunkLength = index === -1 ? message.length : index;
    }
    chunkLength = prevIndex;

    let chunk = message.substring(0, chunkLength);

    // Check if the chunk contains an open code block
    if (chunk.includes("```")) {
      // Loop through the chunk and find all occurrences of "```"
      for (let i = 0; i < chunk.length - 2; i++) {
        if (chunk.substr(i, 3) === "```") {
          if (openCodeBlock) {
            // If there is an open code block, close it
            openCodeBlock = false;
          } else {
            // Otherwise, open a new code block
            openCodeBlock = true;
          }
        }
      }
    }

    // If the chunk doesn't end with "```" and there is an open code block,
    // Add "```" to the end of the chunk and close the code block
    if (openCodeBlock && !chunk.endsWith("```")) {
      chunk = chunk + "\n```";
      openCodeBlock = false;
    }

    // If there is an open code block, add "```" to the front of the chunk
    if (openCodeBlock) {
      chunk = "```\n" + chunk;
    }

    chunks.push(chunk);

    // Remove the processed chunk from the message
    message = message.substring(chunkLength).trim();
  }

  return chunks;
}

module.exports = { sendCodeBlockMessage };
