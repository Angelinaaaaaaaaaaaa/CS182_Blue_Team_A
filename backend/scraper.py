"""
CS182 Blue Team - Enhanced Ed Discussion Scraper
Collects Special Participation A posts from Ed with rich metadata
"""

import os
import json
import csv
import re
from datetime import datetime
from typing import List, Dict, Any
import requests
from dotenv import load_dotenv

load_dotenv()

class EdScraper:
    def __init__(self, course_id: int = 84647):
        self.course_id = course_id
        self.api_token = os.getenv('ED_API_TOKEN')
        if not self.api_token:
            raise ValueError("ED_API_TOKEN not found in environment variables")

        self.base_url = "https://us.edstem.org/api"
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

    def get_threads(self, query: str = "") -> List[Dict[str, Any]]:
        """Fetch all threads from the course"""
        if query:
            print(f"Fetching threads with query: {query}")
        else:
            print("Fetching all threads from course...")

        threads = []
        offset = 0
        limit = 30

        while True:
            url = f"{self.base_url}/courses/{self.course_id}/threads"
            params = {
                "limit": limit,
                "offset": offset,
                "filter": "all"
            }

            # Only add query if provided
            if query:
                params["query"] = query

            try:
                response = requests.get(url, headers=self.headers, params=params)
                response.raise_for_status()
                data = response.json()

                batch = data.get('threads', [])
                if not batch:
                    break

                threads.extend(batch)
                print(f"Fetched {len(threads)} threads so far...")

                offset += limit

                # Check if we've fetched all threads
                if len(batch) < limit:
                    break

            except requests.RequestException as e:
                print(f"Error fetching threads: {e}")
                break

        print(f"Total threads fetched: {len(threads)}")
        return threads

    def extract_metadata(self, title: str) -> Dict[str, str]:
        """Extract model and homework info from title using flexible patterns"""
        metadata = {
            "model": "Unknown",
            "homework": "Unknown"
        }

        # Model patterns with normalized names (pattern, canonical_name)
        # Order matters - more specific patterns first!
        model_patterns = [
            # GPT-5 variants (newest)
            (r'gpt[-\s]?5[-\s]?\(?\s*thinking\s*\)?', 'GPT-5-Thinking'),
            (r'gpt[-\s]?5\.?1[-\s]?thinking', 'GPT-5.1-Thinking'),
            (r'gpt[-\s]?5\.?1', 'GPT-5.1'),
            (r'gpt[-\s]?5', 'GPT-5'),
            # GPT-4o variants
            (r'gpt[-\s]?4o[-\s]?mini', 'GPT-4o-mini'),
            (r'gpt[-\s]?4o', 'GPT-4o'),
            # GPT-4 variants
            (r'gpt[-\s]?4[-\s]?turbo', 'GPT-4-Turbo'),
            (r'gpt[-\s]?4', 'GPT-4'),
            # GPT-3.5
            (r'gpt[-\s]?3\.?5[-\s]?turbo', 'GPT-3.5-Turbo'),
            (r'gpt[-\s]?3\.?5', 'GPT-3.5'),
            # ChatGPT variants
            (r'chatgpt[-\s]?5', 'ChatGPT-5'),
            (r'chatgpt', 'ChatGPT'),
            # o1 series
            (r'o1[-\s]?preview', 'o1-preview'),
            (r'o1[-\s]?mini', 'o1-mini'),
            (r'\bo1\b', 'o1'),  # Word boundary to avoid matching "201"
            # Claude variants
            (r'claude[-\s]?3\.?5[-\s]?sonnet', 'Claude-3.5-Sonnet'),
            (r'claude[-\s]?3[-\s]?opus', 'Claude-3-Opus'),
            (r'claude[-\s]?3[-\s]?sonnet', 'Claude-3-Sonnet'),
            (r'claude[-\s]?sonnet', 'Claude-Sonnet'),
            (r'claude[-\s]?opus', 'Claude-Opus'),
            (r'claude', 'Claude'),
            # Gemini variants
            (r'gemini[-\s]?1\.?5[-\s]?pro', 'Gemini-1.5-Pro'),
            (r'gemini[-\s]?1\.?5[-\s]?flash', 'Gemini-1.5-Flash'),
            (r'gemini[-\s]?pro', 'Gemini-Pro'),
            (r'gemini[-\s]?flash', 'Gemini-Flash'),
            (r'gemma', 'Gemma'),
            (r'gemini', 'Gemini'),
            # DeepSeek variants
            (r'deepseek[-\s]?v?3\.?2', 'DeepSeek-v3.2'),
            (r'deepseek[-\s]?v?3', 'DeepSeek-v3'),
            (r'deepseek', 'DeepSeek'),
            # Llama variants
            (r'llama[-\s]?3\.?1', 'Llama-3.1'),
            (r'llama[-\s]?3', 'Llama-3'),
            (r'llama[-\s]?2', 'Llama-2'),
            (r'llama', 'Llama'),
            # Grok
            (r'grok', 'Grok'),
            # Kimi variants
            (r'kimi[-\s]?k2', 'Kimi-K2'),
            (r'kimi', 'Kimi'),
            # Perplexity variants
            (r'perplexity[-\s]?sonar', 'Perplexity-Sonar'),
            (r'perplexity', 'Perplexity'),
            # GPT-OSS
            (r'gpt[-\s]?oss', 'GPT-OSS'),
            # Other models
            (r'qwen[-\s]?2\.?5', 'Qwen-2.5'),
            (r'qwen[-\s]?2', 'Qwen-2'),
            (r'qwen', 'Qwen'),
            (r'mistral', 'Mistral'),
            (r'mixtral', 'Mixtral'),
            (r'phi[-\s]?3', 'Phi-3'),
            (r'phi', 'Phi'),
        ]

        for pattern, canonical_name in model_patterns:
            if re.search(pattern, title, re.IGNORECASE):
                metadata["model"] = canonical_name
                break

        # Homework patterns
        hw_patterns = [
            r'hwk[- ]?(\d+)',  # Handle "HWK" typo
            r'hw[- ]?(\d+)',
            r'homework[- ]?(\d+)',
            r'h(\d+)',
            r'assignment[- ]?(\d+)',
        ]

        for pattern in hw_patterns:
            match = re.search(pattern, title, re.IGNORECASE)
            if match:
                # Normalize: remove leading zeros (HW02 -> HW2, HW08 -> HW8)
                hw_num = match.group(1).lstrip('0') or '0'
                metadata["homework"] = f"HW{hw_num}"
                break

        return metadata

    def process_threads(self, threads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Process threads to extract relevant information"""
        processed = []

        for thread in threads:
            title = thread.get('title', '')

            # Filter: Only include "Special Participation A" posts
            if not re.search(r'special\s+participation\s+a', title, re.IGNORECASE):
                continue

            # Exclude meta-posts about the website/extra credit itself
            exclude_patterns = [
                r'extra\s+credit\s+website',
                r'blue\s+team.*website',
                r'red\s+team.*website',
                r'website.*blue\s+team',
                r'website.*red\s+team'
            ]

            if any(re.search(pattern, title, re.IGNORECASE) for pattern in exclude_patterns):
                continue

            # Get the main post content
            document = thread.get('document', '')

            metadata = self.extract_metadata(title)

            processed_thread = {
                "id": thread.get('id'),
                "title": thread.get('title', '').strip(),
                "author": thread.get('user', {}).get('name', 'Unknown'),
                "content": document,
                "model": metadata["model"],
                "homework": metadata["homework"],
                "created_at": thread.get('created_at', ''),
                "updated_at": thread.get('updated_at', ''),
                "url": f"https://edstem.org/us/courses/{self.course_id}/discussion/{thread.get('id')}",
                "likes": thread.get('votes', 0),
                "comments": thread.get('comment_count', 0)
            }

            processed.append(processed_thread)

        return processed

    def save_data(self, data: List[Dict[str, Any]], output_dir: str = "data"):
        """Save processed data to JSON and CSV formats"""
        os.makedirs(output_dir, exist_ok=True)

        # Save as JSON
        json_path = os.path.join(output_dir, "special_participation_a.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved JSON to {json_path}")

        # Save as CSV
        csv_path = os.path.join(output_dir, "special_participation_a.csv")
        if data:
            keys = ["id", "title", "author", "model", "homework", "created_at", "url", "likes", "comments"]
            with open(csv_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=keys)
                writer.writeheader()
                for item in data:
                    row = {k: item.get(k, '') for k in keys}
                    writer.writerow(row)
            print(f"Saved CSV to {csv_path}")

        return json_path, csv_path

def main():
    """Main execution function"""
    print("=" * 60)
    print("CS182 Blue Team - Ed Discussion Scraper")
    print("=" * 60)

    try:
        scraper = EdScraper()
        threads = scraper.get_threads()

        if not threads:
            print("No threads found!")
            return

        processed = scraper.process_threads(threads)
        json_path, csv_path = scraper.save_data(processed)

        print("\n" + "=" * 60)
        print(f"Successfully processed {len(processed)} posts")
        print(f"Data saved to:")
        print(f"  - {json_path}")
        print(f"  - {csv_path}")
        print("=" * 60)

    except Exception as e:
        print(f"Error: {e}")
        raise

if __name__ == "__main__":
    main()
