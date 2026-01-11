import fetch from 'node-fetch';

async function addHypnokronoPodcast() {
  try {
    console.log("Adding Hypnokronoo podcast via API...");
    
    const podcastData = {
      title: "Hypnokronoo @ Live Set Naturaíz",
      slug: "hypnokronoo-live-set-naturaiz",
      description: "An immersive live performance featuring hypnotic rhythms and mystical soundscapes from the Naturaíz Records showcase.",
      coverUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
      audioUrl: "https://soundcloud.com/naturaiz/hypnokrono-live-set-naturaiz",
      artistName: "Hypnokrono",
      duration: "85 min",
      genre: "Psychedelic Electronic"
    };

    const response = await fetch('http://localhost:3000/api/podcasts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(podcastData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Podcast added successfully:", result);
    } else {
      const error = await response.text();
      console.error("Failed to add podcast:", error);
    }
  } catch (error) {
    console.error("Error adding podcast:", error);
  }
}

addHypnokronoPodcast(); 