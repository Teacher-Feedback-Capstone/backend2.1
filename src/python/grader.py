import os
from langchain.prompts import PromptTemplate 
from langchain_core.runnables import RunnablePassthrough
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAI
from openai import OpenAI as OpenAIClient
from dotenv import load_dotenv

class grader:
    def __init__(self, api_key):
        self.api_key = api_key
        self.client = OpenAIClient(api_key=api_key)

    def evaluate(self, user_input):
        # Define the prompt template
        prompt_template = PromptTemplate(
            input_variables=["user_input"],
            template=(
                "You are a specialized teaching evaluation AI fine-tuned on expert grading criteria. "
                "Analyze this teaching transcript using the official rubric. "
                "Evaluate **EVERY** component across all three domains:\n\n"

                "### DOMAINS AND SUBSECTIONS TO GRADE:\n"
                "1. **Planning & Preparation**\n"
                "   - 1a. Knowledge of Content\n"
                "   - 1b. Knowledge of Students\n"
                "   - 1c. Instructional Outcomes\n"
                "   - 1d. Resource Knowledge\n"
                "   - 1e. Coherent Instruction\n"
                "   - 1f. Student Assessments\n\n"
                
                "2. **Classroom Environment**\n"
                "   - 2a. Respect/Rapport\n"
                "   - 2b. Learning Culture\n"
                "   - 2c. Classroom Procedures\n"
                "   - 2d. Behavior Management\n\n"
                
                "3. **Instruction**\n"
                "   - 3a. Communication\n"
                "   - 3b. Questioning Techniques\n"
                "   - 3c. Student Engagement\n"
                "   - 3d. Assessment Use\n"
                "   - 3e. Flexibility\n\n"

                "### GRADING REQUIREMENTS:\n"
                "1. For **EACH** subsection (1a-3e):\n"
                "   - Assign a numeric grade (1-4)\n"
                "   - Cite **specific evidence** from the transcript\n"
                "   - Explain using rubric terminology\n\n"
                
                "2. For **EACH** main domain (1-3):\n"
                "   - Provide an overall domain grade (1-4)\n"
                "   - Domain-level rationale\n\n"
                
                "3. Final Summary Must Include:\n"
                "   - Strengths\n"
                "   - Growth Areas\n"
                "   - Professional Development Recommendations\n\n"

                "### OUTPUT FORMAT:\n"
                "```\n"
                "DOMAIN 1: PLANNING & PREPARATION\n"
                "Overall Grade: [N] - [Level]\n"
                "Rationale: [2 sentences]\n\n"
                "1a. Knowledge of Content\n"
                "Grade: [N] - [Level]\n"
                "Evidence: [Exact quote]\n"
                "Rationale: [1 sentence]\n\n"
                "[Repeat for 1b-1f...]\n\n"
                "DOMAIN 2: CLASSROOM ENVIRONMENT\n"
                "[Same structure...]\n\n"
                "DOMAIN 3: INSTRUCTION\n"
                "[Same structure...]\n\n"
                "FINAL SUMMARY\n"
                "- Strengths: [Bullet points]\n"
                "- Growth Areas: [Bullet points]\n"
                "- Recommendations: [Actionable steps]\n"
                "```\n\n"
                "Teaching Transcript:\n{user_input}\n\n"
                "Begin evaluation:"
            )
        )

        # Initialize with ChatOpenAI instead of OpenAI
        llm = ChatOpenAI(
            model="ft:gpt-3.5-turbo-0125:personal::BBahdrwY",
            temperature=0.2,
            max_tokens=1500,
            openai_api_key=self.api_key
        )

        # Create new-style chain
        chain = (
            {"user_input": RunnablePassthrough()}
            | prompt_template
            | llm
        )

        # Invoke the chain
        result = chain.invoke(user_input)
        
        return result.content

    # ---------------------
    # 7. Main Program
    # ---------------------
if __name__ == "__main__":
    # Prompt the user for a teaching session to evaluate
    # Load environment variables from a .env file
    load_dotenv()
    openai_api_key = os.getenv("OPENAI_API_KEY")  # Replace with your OpenAI API key
    # client = OpenAIClient(api_key=openai_api_key)
    grader = grader(openai_api_key)

    # user_input = "Good morning class, so today we are going to be continuing on with the novel code talkers. So I have a little secret code that we're going to work on today. So I'm going to go ahead and pass out these little note cards for you. Add this Jenna, this Bella, this is Brooke and Miss Arlene. So with these we have a little code, so we have little pictures and the right underneath is going to be a little letter. So we're going to work together to solve our secret code. So can anybody raise their hand if they have a toothbrush? Okay, let's underneath your teeth, letter P, a P. Perfect. Does anybody have a little flower? Jenna, I, and I. And then a table, a P. Oh, two. What are our letters? I have a Z. I have a Z. A Z to perfect. So we have two z's and then does anybody have a tree? We have two trees so I'll take one first so I'm just broke and A and A perfect we have another two fresh Jenna, a key again and then another tree what is it? A and A job. And then we have a car. We have two cars. Arlene, what's your car? R. And R. You have the donuts. Brooke? T. T. And he has little candle. Jenna? Why? Why? Perfect. Who hasn't here? Bella, what is that? A bed? Arlene? Oh. Oh, we're getting close. Who has another car? Oh, Brooke? Ar, heart, heart, Jenna L. L. Who was a trumpet? Bella. You. Who has an umbrella? Arlene. N, N. Who has a pencil? Brooke? See? Who has our last one, the spoon? What is it? H and H. Wanna read together what it says? pizza party for lunch. Yeah! So just like this very similar, we used our code to get our message across our pizza party for lunch. So that is what our Navajo code talkers did. They worked together using a series of their words, and they used it to get secret messages across so that way the enemies couldn't find out what they were talking about. So we used this in World War II. It was one of the biggest wars that we've had in history. It lasted for about six years, the long time. It began in 1935, which is about 85 years ago. And we had 29 men first recruited to serve in our military, the Marines. And by the end of the war, about 400 Navajo men served to help us with our codes. Now communication was very important because we didn't want the enemies to know what our messages were. So we planned where we were going to go, what our plans were, everything we were going to do. So it was very important. So some of the important battles that they fought and was the battle of EO came up. Six co-talkers sent and received more than 800 messages. So this is one message. Imagine 800. It was a lot of messages and it was very important because it helped us win the war. So using that we are going to think a pair of share with each other. What are some important details that we learned from this little map? We want to talk with each other. That's the only thing that can come in that history. That's the only thing that I was going to pick. Yeah. And you imagine, I wish we could see if they didn't sound."

    user_input = "Teacher: Good morning, class. Today, we’re learning about photosynthesis. Can anyone tell me what photosynthesis is?  Student 1: Uh, is it when plants eat food?  Teacher: Not quite. Photosynthesis is when plants use sunlight to make food. (Pauses) Okay, so plants take in sunlight, water, and…um…carbon dioxide, and they produce oxygen and…um…sugar. Does that make sense?  Student 2: Kind of. Is it like when we eat candy for energy?  Teacher: Hmm…sort of, but plants don’t eat candy. They make their own energy. (Smiles awkwardly) Anyway, let’s move on. Can someone name the parts of a plant involved in photosynthesis?  Student 1: The leaves?  Teacher: Yes! Good. The leaves are like tiny factories. Anything else?  Student 2: Roots?  Teacher: Uh, not really. (Pauses) Actually, roots just absorb water. The main parts for photosynthesis are the leaves and, um, the chloroplasts inside them. (Writes “Chloroplasts” on the board but spells it “Cloroplasts.”) Let’s keep going.  Teacher: So, plants use sunlight, water, and carbon dioxide. What do they produce? Anyone remember?  Student 1: Oxygen!  Teacher: Yes! And…something else? (Looks at notes) Sugar! They make glucose, which is a type of sugar. (Turns to board and writes “Oxygen + Sugar”).  Student 2: How do they make sugar?  Teacher: Uh…well, it’s a chemical process called the Calvin Cycle, but we won’t go into details. It’s…complicated. (Glances at clock) Let’s just focus on sunlight, water, and carbon dioxide.  Student 1: Do all plants do this? Like, even cacti?  Teacher: (Hesitates) Um, yes, all plants photosynthesize, but cacti might do it a little differently. They use a process called CAM photosynthesis…um, but let’s not get sidetracked.  Student 2: So, do they need sunlight all the time?  Teacher: Hmm…plants need sunlight during the day, but they don’t use it at night. At night, they do something called respiration. (Pauses) Well, we’re getting off-topic. Let’s go back to the basics.  Student 1: What’s respiration?  Teacher: Uh…we’ll cover that another day. (Moves quickly to another topic) Alright, let’s do an activity. I want you to draw a plant and label where photosynthesis happens. (Hands out worksheets)  Student 2: Can we work together?  Teacher: Hmm…no, this is individual work. But you can ask me if you’re stuck.  Student 1: (Raises hand) Do we have to color it?  Teacher: No, just label it. (Glances at clock) Okay, we have five minutes. Get started.  Student 2: (After a minute) I don’t get this. What’s a chloroplast again?  Teacher: It’s the thing in the leaves that helps with photosynthesis. (Points vaguely at the board) I wrote it here.  Student 2: But it’s spelled wrong.  Teacher: (Frowns) Oh. Um…okay. Just fix it on your paper."

    if not user_input.strip():
        print("No input provided. Exiting...")
    else:
        # Evaluate the user-provided transcript
        try:
            print(f"processing:{user_input}")
            feedback = grader.evaluate(user_input={"user_input"})
            print("\nEvaluation Result:")
            print(feedback)
        except Exception as e:
            print(f"Error: {e}")
