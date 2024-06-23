From Potholes to Peace of Mind — Roadie's Got Your Drive Covered.

## Inspiration
Every year, Americans spend a staggering 70 billion hours behind the wheel-- motivated by this, our team set out to not only transform these journeys to be safer, but also more engaging and personalized. From tackling the critical and often overlooked issue of drowsy or anxious driving, responsible for 21% of fatal vehicle crashes annually, to addressing dangerous and damaging road infrastructure that disproportionately affects California-- where we all attend college-- we wanted to create something to enhance every mile.

## What it does
Beyond driving, Roadie paves your path to peace of mind across three key features: 
1. Facial recognition (ft. Hume): Monitors your expressions while driving in real-time to detect emotions like sleepiness, anxiety, and surprise. Depending on your expression, produces context-sensitive prompts to keep you alert and focused on the road.
2. Audio Chatbot (ft. Hume): Simply say “Hey Roadie” to activate the chatbot or “Byebye Roadie” to deactivate it. Interact as needed, whether you're winding down from a scary movie at a friends' or asking for the "latest new on Taylor Swift."
3. Pothole/Roadsign detection: Not just about keeping you company. Trained a model that scans the road for easy-to-miss hazards like potholes (costs drivers $3 billion annually and disproportionately affects lower-income areas with neglected infrastructure) and road signs.

## Built With
1. Hume expression analysis with custom hook for tracking persistent expressions, connected to Hume EVI for activation, Next.js/Tailwind/React for frontend
2. Porcupine for wake words, Hume EVI for conversational AI, using Claude 3 Opus for AI, Next.js/Tailwind/React for frontend
3. Ultralytic’s YOLO model custom trained for pothole object detection, Bytedance Depth Anything for depth perception, which we trained on A100 GPUs

## What we learned

Initially, generating the mesh took multiple days according to TQDM. After brainstorming together, we realized that there is an data structure we learned in class that enables us to query points in K log(N) instead of K * N. This taught us that what we learned in class can be applied to build real-world projects.

We also learned that in order to work effectively as a team, we need to parallelize tasks, similar to how we have parallel computer processes. We divided our work up into the LLM and Computer Vision aspects and combined our efforts in the end, enabling Roadie to possess a true multi-modal suite of capabilities for driving assistant.

## Challenges We Ran Into
We also bought a Raspberry Pi for dashboard installation but there were no Raspberry Pi peripherals (cameras, mics, speakers) available at Best Buy :(. This would be very useful to integrate everything together for an actual final product.

Also, this was our first time training YOLO models and working with Depth Anything, which was very fun yet challenging! Parsing through the Hume documentation for React was also a bit hard — a recommendation for the devs: a lot of the information regarding socket inputs/outputs could be clearer!

## What's next for Roadie

Apart from getting hardware setup with a Raspberry Pi, in the future, we also want to connect our YOLO/Depth pipeline with a FastAPI backend to connect directly with Hume’s EVI so that it can actively alert the user within the car given our depth perception model’s assessment of pothole’s closeness. We’re really happy that we have the depth perception system overall though! We have also trained models for traffic signs and pedestrians, which can be integrated to the model as well.

# Some extra technical details! 

### Monocular Depth Perception: 3D Scene Understanding
- We collected driving data around Berkeley to fine-tune our depth estimation model. We utilized Intel’s AI-PCs for all the fine-tuning as well as inference
- The core model is based on the DINOv2 model from Meta. We utilized its pretrained weights as a backbone to extract feature maps from the original images and transform it into a small latent space. --
- Then, we appended a custom segmentation head from the Depth Anything model, which performed metric depth prediction for each pixel in the image. Finally, we back-propped and fine-tuned this model on the data we collected driving around Berkeley
- This model works on single frames, so in order to have it perform well on video, we also did averaging and smoothing across frames

### Objection Detection: Potholes, traffic signs, road objects
- We utilized the YOLO (You Only Look Once) model for its fast inference times. We achieve ~30 fps inference times using Intel AI-PC’s GPUs, enabling Roadie to warn users in real time
- We fine-tuned YOLO using three datasets: [The German Traffic Sign Recognition Benchmark](https://www.kaggle.com/datasets/meowmeowmeowmeowmeow/gtsrb-german-traffic-sign), [Self Driving Cars Kaggle dataset](https://www.kaggle.com/datasets/alincijov/self-driving-cars), and the [Pothole image dataset](https://www.kaggle.com/datasets/sachinpatel21/pothole-image-dataset )
- We were able to achieve an average of 0.7 mAP across all three object detection modalities, which is comparable to human performance

### Depth Perception to 3D Point cloud and meshing
- We converted the depth perception image to 3D point cloud using the open3d library. The camera intrinsics we used are Focal Length 715.0873, FX 156.3, FY 156.3
- Using the point cloud, we are able to determine how far away potholes, humans, and other traffic objects are from the car. This information is fed into the front end so Roadie can warn the user appropriately.
- In order to turn the 3D point cloud into an actual mesh, we utilized the Oct-Tree data structure, which enables fast querying of K nearby points to any arbitrary point. The algorithm works as follows:
- For each point in the point cloud, look at the closest 12 points, or all the points withing a 0.2 meter radius, whichever is closer.
- Then, sort these points according their angle to the point we’re considering. 
- Finally, draw triangle surfaces on the point we’re considering and all two adjacent points in the sorted nearby points list
- Even with these optimizations, generating the 30 second video in the demo took overnight. There are over a million points in each frame’s point cloud. Without Intel’s compute, we would not have been able to accomplish this in time.