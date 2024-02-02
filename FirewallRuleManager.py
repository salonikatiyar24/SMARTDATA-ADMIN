from azure.core.exceptions import HttpResponseError
from azure.mgmt.sql import SqlManagementClient
from azure.mgmt.sql.models import (
    FirewallRule,
    DatabaseVulnerabilityAssessmentRuleBaseline,
    DatabaseVulnerabilityAssessmentRuleBaselineItem,
)

class FirewallRuleManager():
    def __init__(self,credential,sqlConfig,logger) -> None:
        self.RESOURCE_GROUP_NAME = sqlConfig['RESOURCE_GROUP_NAME']
        self.SERVER_NAME = sqlConfig['SERVER_NAME']
        self.curr_firewall = []
        self.curr_baseline = []
        self.logger = logger

        self.sql = SqlManagementClient(credential, sqlConfig['SUBSCRIPTION_ID'])

    def get_firewall_rules(self,refresh=True):
        if refresh==True or not hasattr(self,'curr_firewall'):
            self.curr_firewall = list(self.sql.firewall_rules.list_by_server(
                self.RESOURCE_GROUP_NAME, self.SERVER_NAME
            ))
        return self.curr_firewall
    
    def get_baseline_rules(self,refresh=True):
        if refresh==True or not hasattr(self,'curr_baseline'):
            self.curr_baseline = self.sql.database_vulnerability_assessment_rule_baselines.get(
                resource_group_name=self.RESOURCE_GROUP_NAME,
                server_name=self.SERVER_NAME,
                database_name="master",
                vulnerability_assessment_name="VA2065",
                rule_id="VA2065",
                baseline_name="default"
            )
            self.updated_baseline = [r for r in self.curr_baseline.baseline_results]
        
        return self.curr_baseline
    
    def set_baseline_rules(self):
        updateRules = [r.as_dict() for r in self.updated_baseline]
        self.curr_baseline = self.sql.database_vulnerability_assessment_rule_baselines.create_or_update(
            resource_group_name=self.RESOURCE_GROUP_NAME,
            server_name=self.SERVER_NAME,
            database_name="master",
            vulnerability_assessment_name="VA2065",
            rule_id="VA2065",
            baseline_name="default",
                        parameters=DatabaseVulnerabilityAssessmentRuleBaseline(
                baseline_results=updateRules
            )
        )

    def _del_rule(self,instr):
        self.sql.firewall_rules.delete(
            self.RESOURCE_GROUP_NAME, 
            self.SERVER_NAME,
            instr['key']
        )

        self.updated_baseline = [
            r for r in self.updated_baseline if r.result[0] != instr["key"]
        ]

    def _add_rule(self,instr):
        firewall_rule_parameters = FirewallRule(
            start_ip_address=instr['start'], 
            end_ip_address=instr['end']
        )
        self.sql.firewall_rules.create_or_update(
            self.RESOURCE_GROUP_NAME,
            self.SERVER_NAME,
            instr['name'],
            parameters=firewall_rule_parameters,
        )

        new_baseline_item = DatabaseVulnerabilityAssessmentRuleBaselineItem(
            result=[instr['name'], instr['start'], instr['end']]
        )
        self.updated_baseline.append(new_baseline_item)
    
    def update_rules(self,instructions):
        self.get_baseline_rules(True)
        resp = {
            'instructions': {
                'add':len(instructions['addedRow']),
                'update':len(instructions['changedRow']),
                'remove':len(instructions['deletedRow'])
            },
            'success': {
                'add':0,
                'update':0,
                'remove':0
            },
            'failure': {
                'add':0,
                'update':0,
                'remove':0
            }
        }

        for instr in instructions['changedRow']:
            try:
                self.logger.log('firewallChange',instr)
                self._del_rule(instr)
                self._add_rule(instr)
                resp['success']['update'] += 1
            except HttpResponseError:
                resp['failure']['update'] += 1
        for instr in instructions['deletedRow']:
            try:
                self.logger.log('firewallRemove',instr)
                self._del_rule(instr)
                resp['success']['remove'] += 1
            except HttpResponseError:
                resp['failure']['remove'] += 1
        for instr in instructions['addedRow']:
            try:
                self.logger.log('firewallAdd',instr)
                self._add_rule(instr)
                resp['success']['add'] += 1
            except HttpResponseError:
                resp['failure']['add'] += 1

        self.set_baseline_rules()

        return resp