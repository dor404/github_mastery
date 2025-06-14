import sys
import urllib.request
import io
from openpyxl import load_workbook

def calculate_satisfaction_score(row):
    # Indices of numeric columns that indicate satisfaction (1-based index)
    satisfaction_columns = [
        5,  # The tutorials are well-structured and easy to follow
        6,  # The exercises help reinforce the concepts learned
        7,  # The quizzes effectively test my understanding
        8,  # The progression of topics makes sense
        9,  # The content is up-to-date with current GitHub features
        10, # How helpful is the personal dashboard?
        13, # The progress tracking accurately reflects my learning journey
        14, # I find the progress indicators motivating
        15, # The dashboard provides useful insights about my learning
        17, # The leaderboard motivates me to complete more exercises
        18, # The scoring system is fair and transparent
        23, # The AI chatbot provides helpful responses
        24, # The AI chatbot understands my questions correctly
        29, # Chatbot and exercises integration
        30, # Leaderboard and progress tracking
        31, # Chatbot and error resolution
        36, # How would you rate the platform's performance?
        37, # How would you rate the platform's user interface?
        38  # How likely are you to recommend this platform to others?
    ]
    
    try:
        total = 0
        valid_counts = 0
        
        # Convert 1-based indices to 0-based for array access
        for col_index in satisfaction_columns:
            try:
                cell_value = row[col_index - 1].value if row[col_index - 1].value else 0
                if isinstance(cell_value, (int, float)) and cell_value > 0:
                    total += float(cell_value)
                    valid_counts += 1
            except (ValueError, IndexError, AttributeError):
                continue
                
        if valid_counts == 0:
            return 0
            
        # Calculate average and convert to percentage (assuming 1-10 scale for recommendation, 1-5 for others)
        avg_score = (total / valid_counts)
        if valid_counts == 1 and satisfaction_columns[-1] == 38:  # If only recommendation score
            percentage = (avg_score / 10) * 100  # Scale of 1-10
        else:
            percentage = (avg_score / 5) * 100  # Scale of 1-5
        return percentage
        
    except Exception as e:
        print(f"Error processing row: {str(e)}")
        return 0

def get_survey_data(url):
    try:
        # Download the Excel file
        response = urllib.request.urlopen(url)
        excel_data = response.read()
        
        # Load workbook from the downloaded bytes
        wb = load_workbook(io.BytesIO(excel_data))
        ws = wb.active
        
        # Skip header row and process data
        satisfaction_scores = []
        for row in list(ws.rows)[1:]:  # Skip header row
            if any(cell.value for cell in row):  # Skip empty rows
                score = calculate_satisfaction_score(row)
                if score > 0:  # Only include valid scores
                    satisfaction_scores.append(score)
        
        if not satisfaction_scores:
            print("No valid data found in the survey responses")
            return 1
            
        avg_satisfaction = sum(satisfaction_scores) / len(satisfaction_scores)
        print(f"Average satisfaction score: {avg_satisfaction:.2f}%")
        print(f"Number of responses analyzed: {len(satisfaction_scores)}")
        
        if avg_satisfaction >= 80:
            print("✅ Satisfaction is above threshold!")
            return 0
        else:
            print("⚠️ Satisfaction below 80% threshold!")
            return 1
            
    except Exception as e:
        print(f"Error processing survey data: {str(e)}")
        return 1

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python survey_check.py <google_sheets_xlsx_url>")
        sys.exit(1)
        
    url = sys.argv[1]
    sys.exit(get_survey_data(url)) 