echo "starting git push script"
git init
git add .
read -p "Enter commit message: " commit_message
git commit -m "$commit_message"
git push 