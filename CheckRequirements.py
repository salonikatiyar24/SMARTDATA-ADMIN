from sys import exit
from pathlib import Path
import pkg_resources
from colorama import Fore, Back, Style

def CheckRequirements():
    _REQUIREMENTS_PATH = Path(__file__).with_name("requirements.txt")
    _REQUIREMENTS_STR = str(_REQUIREMENTS_PATH)
    with open(_REQUIREMENTS_PATH,'r', encoding='utf-16') as reqs:
        requirements = [req.split('==')[0].lower() for req in reqs.read().split('\n')]

    # Get installed packages
    installed_packages = pkg_resources.working_set
    installed_packages_list = [i.key.lower() for i in installed_packages]

    # Check if required package is installed
    for requirement in requirements:
        if requirement not in installed_packages_list:
            
            errStyle = Back.RED + Fore.WHITE

            message = (errStyle +
                       f"This function requires {', '.join(requirements)}. "
                       f"To continue, please install them with one of the commands below:{Style.RESET_ALL}\n"
                       f"    {errStyle}pip install -r {_REQUIREMENTS_STR!r}      {Style.RESET_ALL}\n"
                       f"    {errStyle}conda install --file {_REQUIREMENTS_STR!r}{Style.RESET_ALL}")

            print(message)
            exit()

            # raise ImportError(message)

CheckRequirements()