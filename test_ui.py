from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
# --- SETUP ---
driver = webdriver.Chrome()
driver.maximize_window()
wait = WebDriverWait(driver, 10)

# --- Helper function to wait for popups to disappear ---
def wait_for_popups_to_disappear():
    try:
        popups = driver.find_elements(By.CLASS_NAME, "popup")
        for popup in popups:
            wait.until(EC.invisibility_of_element(popup))
    except:
        pass

# --- Registration ---
def register_user(email: str, password: str):
    driver.get("https://startupideavalidator.vercel.app/register")
    driver.find_element(By.NAME, "email").send_keys(email)
    driver.find_element(By.NAME, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    try:
        success_msg = wait.until(EC.presence_of_element_located(
            (By.XPATH, "//*[contains(text(),'success')]")
        ))
        time.sleep(5)   
        print(f"✅ Registration Passed for {email}")
        wait_for_popups_to_disappear()
    except:
        print(f"⚠ Registration may already exist for {email}, continuing...")

# --- Login ---
def login_user(email: str, password: str):
    
    driver.get("https://startupideavalidator.vercel.app/login")
    driver.find_element(By.NAME, "email").send_keys(email)
    driver.find_element(By.NAME, "password").send_keys(password)
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    wait.until(EC.url_contains("dashboard"))
    print(f"✅ Login Passed for {email}")

# --- Navigate to Profile ---
def go_to_profile():
    profile_avatar = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "profile-avatar")))
    profile_avatar.click()
    wait_for_popups_to_disappear()
    profile_link = wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Profile")))
    profile_link.click()
    time.sleep(5)
    wait.until(EC.url_contains("profile"))
    print("✅ Dashboard → Profile Navigation Passed")

# --- Navigate to Settings ---
def go_to_settings():
    profile_avatar = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "profile-avatar")))
    profile_avatar.click()
    wait_for_popups_to_disappear()
    settings_link = wait.until(EC.element_to_be_clickable((By.LINK_TEXT, "Settings")))
    settings_link.click()
    time.sleep(5)
    wait.until(EC.url_contains("settings"))
    print("✅ Dashboard → Settings Navigation Passed")

# --- Logout ---
def logout_user():
    profile_avatar = wait.until(EC.element_to_be_clickable((By.CLASS_NAME, "profile-avatar")))
    profile_avatar.click()
    wait_for_popups_to_disappear()
    time.sleep(5)
    logout_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[text()='Logout']")))
    logout_button.click()
    wait.until(EC.url_contains("login"))
    print("✅ Logout Passed")

def submit_idea(form_data: dict):
    """
    form_data should be like:
    {
        "name": "TourTrip",
        "problem_statement": "Problem...",
        "solution": "Solution...",
        "target_market": "Target Market...",
        "business_model": "Business Model...",
        "team": "Team details..."
    }
    """
    driver.get("https://startupideavalidator.vercel.app/create")
    
    # Wait for form to load
    wait.until(EC.presence_of_element_located((By.CLASS_NAME, "create-idea")))
    
    # Fill the form fields
    driver.find_element(By.NAME, "name").send_keys(form_data.get("name", ""))
    time.sleep(1)
    driver.find_element(By.NAME, "problem_statement").send_keys(form_data.get("problem_statement", ""))
    time.sleep(1)
    driver.find_element(By.NAME, "solution").send_keys(form_data.get("solution", ""))
    time.sleep(1)
    driver.find_element(By.NAME, "target_market").send_keys(form_data.get("target_market", ""))
    time.sleep(1)
    driver.find_element(By.NAME, "business_model").send_keys(form_data.get("business_model", ""))
    time.sleep(1)
    driver.find_element(By.NAME, "team").send_keys(form_data.get("team", ""))
    time.sleep(2)
    # Submit the form
    submit_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    submit_btn.click()
    time.sleep(5)
    # Wait for success popup or page redirect
    try:
        wait.until(EC.presence_of_element_located((By.CLASS_NAME, "popup")))
        print(f"✅ Idea '{form_data['name']}' Submitted Successfully")
    except:
        print(f"⚠️ Idea '{form_data['name']}' submission may have failed")

def view_idea(idea_name):
    driver.get("https://startupideavalidator.vercel.app/dashboard")
    
    # Wait for the ideas grid container to appear
    wait.until(EC.presence_of_element_located((By.CLASS_NAME, "ideas-grid")))
    
    # Wait for the specific idea card to appear inside the grid
    idea_card = wait.until(EC.element_to_be_clickable((
        By.XPATH,
        f"//div[@class='ideas-grid']//h3[text()='{idea_name}']/parent::a"
    )))
    
    # Optional: scroll into view if not clickable
    driver.execute_script("arguments[0].scrollIntoView(true);", idea_card)
    
    idea_card.click()
    time.sleep(5)
    print(f"✅ Idea Viewing Passed for '{idea_name}'")


# --- Example Usage ---
try:
    email = "bmanideepreddy3101@gmail.com"
    password = "12345"
    data= {
        "name": "Startup Idea Validator",
        "problem_statement": "Early-stage founders struggle ",
        "solution": "A web app that uses AI to analyze and score startup ideas. and ai powered chatbot analyzer to talk to founders",
        "target_market": "Student entrepreneurs ",
        "team": "2 developers, system designer , analyst ",
        "business_model": "1 marketing saas"
    }
    register_user(email, password)
    login_user(email, password)
    submit_idea(data)
    view_idea("TourTrip")
    go_to_profile()
    go_to_settings()
    logout_user()

finally:
    driver.quit()
